<template>
  <el-dialog 
    :visible.sync="isVisible" 
    :title="isEditing ? '编辑交易' : '新增交易'"
    width="500px" 
    custom-class="transaction-form-dialog"
    :close-on-click-modal="true"
    :before-close="handleBeforeClose"
    @close="handleClose"
  >
    <div class="dialog-content">
      <!-- 分类选择器 -->
      <transition name="fade-transform" mode="out-in">
        <CategoriesComponent 
          :visible="isVisible" 
          @categorySelected="handleCategorySelected" 
          :defaultCategory="defaultCategory"
        />
      </transition>

      <!-- 输入表单 -->
      <el-form 
        ref="form"
        :model="form" 
        :rules="rules"
        label-width="80px"
        class="transaction-form"
        size="small"
        @submit.native.prevent="saveTransaction"
      >
        <el-form-item label="账本" prop="ledgerId">
          <el-select 
            v-model="form.ledgerId" 
            placeholder="选择账本"
            class="full-width"
          >
            <el-option
              v-for="ledger in ledgers"
              :key="ledger.id"
              :label="ledger.name"
              :value="ledger.id"
            >
              <span class="select-option">
                <i class="el-icon-notebook-2"></i>
                {{ ledger.name }}
              </span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="金额" prop="amount">
          <el-input 
            v-model.number="form.amount" 
            placeholder="请输入金额"
            class="amount-input"
            @keyup.enter.native="saveTransaction"
          >
            <template slot="prepend">¥</template>
          </el-input>
        </el-form-item>

        <el-form-item label="备注" prop="description">
          <el-input 
            v-model="form.description" 
            placeholder="请输入备注"
            type="textarea"
            :rows="2"
            resize="none"
            maxlength="20"
            show-word-limit
          ></el-input>
        </el-form-item>

        <el-form-item label="时间" prop="time">
          <el-date-picker
            v-model="form.time"
            type="datetime"
            placeholder="选择日期时间"
            value-format="yyyy-MM-dd HH:mm"
            :picker-options="pickerOptions"
            class="full-width"
          ></el-date-picker>
        </el-form-item>

        <el-form-item label="资产" prop="fundId">
          <el-select 
            v-model="form.fundId" 
            placeholder="请选择资产"
            class="full-width"
          >
            <el-option
              v-for="fund in getFunds"
              :key="fund.id"
              :label="fund.name"
              :value="fund.id"
            >
              <span class="select-option">
                <i class="el-icon-wallet"></i>
                {{ fund.name }}
              </span>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <div slot="footer" class="dialog-footer">
      <el-button @click="closeDialog">取消</el-button>
      <el-button 
        type="primary" 
        @click="saveTransaction"
        :loading="saving"
      >
        <i class="el-icon-check"></i>
        {{ isEditing ? '保存修改' : '确认新增' }}
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import CategoriesComponent from './CategoriesComponent.vue';
import api from '@/api/api';
import { mapGetters } from 'vuex';
import moment from 'moment'; // 使用 moment.js 进行日期格式化

export default {
  components: {
    CategoriesComponent
  },
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    ledgers: {
      type: Array,
      default: () => []
    },
    getFunds: {
      type: Array,
      default: () => [] // 提供默认值
    },
    editingTransaction: {
      type: Object,
      default: () => null
    }
  },
  data() {
    return {
      isVisible: this.visible,
      defaultCategory: null,
      isEditing: false,
      saving: false,
      pickerOptions: {
        shortcuts: [{
          text: '今天',
          onClick(picker) {
            picker.$emit('pick', new Date());
          }
        }, {
          text: '昨天',
          onClick(picker) {
            const date = new Date();
            date.setTime(date.getTime() - 3600 * 1000 * 24);
            picker.$emit('pick', date);
          }
        }]
      },
      rules: {
        ledgerId: [
          { required: true, message: '请选择账本', trigger: 'change' }
        ],
        amount: [
          { required: true, message: '请输入金额', trigger: 'blur' },
          { type: 'number', message: '金额必须为数字', trigger: ['blur', 'change'] },
          { validator: (rule, value, callback) => {
            if (value <= 0) {
              callback(new Error('金额必须大于0'));
            } else {
              callback();
            }
          }, trigger: ['blur', 'change'] }
        ],
        time: [
          { required: true, message: '请选择时间', trigger: 'change' }
        ],
        fundId: [
          { required: true, message: '请选择资产', trigger: 'change' }
        ]
      },
      form: {
        id: null,
        amount: '',
        description: null,
        time: new Date(),
        fundId: '',
        ledgerId: '',
        categoryId: '',
        type: ''
      }
    };
  },
  computed: {
    ...mapGetters(['getUserInfo'])
  },
  watch: {
    visible(newVal) {
      this.isVisible = newVal;
      if (!newVal) {
        // 当对话框关闭时，重置编辑状态
        this.isEditing = false;
        this.resetForm();
      } else if (!this.isEditing) {
        // 新增时，设置默认账本和资产
        this.setDefaultLedger();
        this.setDefaultFund();
        this.form.time = this.getCurrentDateTime();
      }
    },
    editingTransaction: {
      immediate: true,
      handler(transaction) {
        // 只有当有transaction数据时才设置为编辑模式
        this.isEditing = !!transaction;
        if (transaction) {
          // 设置默认分类
          this.defaultCategory = {
            id: transaction.categoryId,
            type: transaction.type,
            name: transaction.category
          };

          // 填充表单数据
          this.form = {
            id: transaction.id,
            amount: transaction.amount,
            description: transaction.description || null,
            time: transaction.time,
            // 确保使用正确的ID
            fundId: transaction.fundId,
            ledgerId: transaction.ledgerId,
            categoryId: transaction.categoryId,
            type: transaction.type
          };

          // 如果没有ledgerId但有ledger名称，尝试从ledgers中找到对应的ID
          if (!this.form.ledgerId && transaction.ledger && this.ledgers.length > 0) {
            const matchedLedger = this.ledgers.find(l => l.name === transaction.ledger);
            if (matchedLedger) {
              this.form.ledgerId = matchedLedger.id;
            }
          }

          // 如果没有fundId但有fundName，尝试从getFunds中找到对应的ID
          if (!this.form.fundId && transaction.fundName && this.getFunds.length > 0) {
            const matchedFund = this.getFunds.find(f => f.name === transaction.fundName);
            if (matchedFund) {
              this.form.fundId = matchedFund.id;
            }
          }
        } else {
          // 清空默认分类和表单
          this.defaultCategory = null;
          this.resetForm();
          // 设置默认账本和资产
          this.setDefaultLedger();
          this.setDefaultFund();
        }
      }
    },
    // 监听ledgers变化，确保在ledgers加载完成后设置默认账本
    ledgers: {
      immediate: true,
      handler(newLedgers) {
        if (!this.isEditing && newLedgers && newLedgers.length > 0) {
          this.setDefaultLedger();
        }
      }
    },
    // 监听getFunds变化，确保在资产数据加载完成后设置默认资产
    getFunds: {
      immediate: true,
      handler(newFunds) {
        if (!this.isEditing && newFunds && newFunds.length > 0) {
          this.setDefaultFund();
        }
      }
    }
  },
  methods: {
    setDefaultLedger() {
      // 查找初始账本
      const defaultLedger = this.ledgers && this.ledgers.find(l => l.name === '初始账本');
      if (defaultLedger) {
        this.form.ledgerId = defaultLedger.id;
      }
    },
    setDefaultFund() {
      // 查找默认资产
      const defaultFund = this.getFunds && this.getFunds.find(f => f.name === '默认资产');
      if (defaultFund) {
        this.form.fundId = defaultFund.id;
      }
    },
    handleBeforeClose(done) {
      // 检查表单是否有修改
      const hasChanges = this.form.amount || 
                        this.form.description || 
                        this.form.categoryId ||
                        (this.form.time && this.form.time !== this.getCurrentDateTime());

      if (hasChanges) {
        this.$confirm('确认关闭？未保存的内容将会丢失', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.closeDialog();
          done();
        }).catch(() => {});
      } else {
        this.closeDialog();
        done();
      }
    },
    handleClose() {
      // 检查表单是否有修改
      const hasChanges = this.form.amount || 
                        this.form.description || 
                        this.form.categoryId ||
                        (this.form.time && this.form.time !== this.getCurrentDateTime());

      if (hasChanges) {
        this.$confirm('确认关闭？未保存的内容将会丢失', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.closeDialog();
        }).catch(() => {});
      } else {
        this.closeDialog();
      }
    },
    handleCategorySelected(categoryId, categoryType) {
      this.form.categoryId = categoryId;
      this.form.type = categoryType;
    },
    async saveTransaction() {
      // 先进行表单验证
      try {
        await this.$refs.form.validate();
      } catch (error) {
        return;
      }

      // 检查分类是否选择
      if (!this.form.categoryId) {
        this.$message.error('分类不能为空，请选择分类。');
        return;
      }

      this.saving = true;
      try {
        // 格式化时间为后端期望的格式
        const formattedTime = moment(this.form.time).format('YYYY-MM-DD HH:mm');
        const transactionData = {
          ...this.form,
          time: formattedTime, // 使用格式化后的时间
        };

        const response = await (this.isEditing 
          ? api.updateTransaction(this.form.id, transactionData)
          : api.saveTransaction(this.getUserInfo.id, transactionData));

        if (response) {
          this.$message({
            type: 'success',
            message: this.isEditing ? '修改成功' : '保存成功',
            duration: 2000
          });
          this.closeDialog();
          this.$emit('transaction-saved');
        }
      } catch (error) {
        this.$message({
          type: 'error',
          message: this.isEditing ? '修改失败' : '保存失败',
          duration: 2000
        });
        console.error('保存交易记录失败:', error);
      } finally {
        this.saving = false;
      }
    },
    closeDialog() {
      this.resetForm();
      this.$emit('update:visible', false);
      this.isVisible = false;
      this.isEditing = false;
    },
    resetForm() {
      if (this.$refs.form) {
        this.$refs.form.resetFields();
      }
      this.form = {
        id: null,
        amount: '',
        description: null,
        time: '',
        fundId: '',
        ledgerId: '',
        categoryId: '',
        type: ''
      };
      this.defaultCategory = null;
    },

    getCurrentDateTime() {
      const date = new Date();
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        throw new Error('Invalid date object');
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hour}:${minute}`;
    }
  }
};
</script>

<style scoped>
.transaction-form-dialog {
  border-radius: 8px;
  overflow: hidden;
}

.dialog-content {
  padding: 0 20px;
}

.transaction-form {
  margin-top: 20px;
}

.full-width {
  width: 100%;
}

.amount-input :deep(.el-input-group__prepend) {
  background-color: #f5f7fa;
  color: #909399;
  font-weight: bold;
}

.select-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.select-option i {
  font-size: 16px;
  color: #909399;
}

/* 表单项动画 */
.el-form-item {
  transition: all 0.3s ease-in-out;
}

.el-form-item:hover {
  transform: translateX(4px);
}

/* 淡入淡出动画 */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}

.fade-transform-enter {
  opacity: 0;
  transform: translateX(-20px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* 对话框动画 */
.transaction-form-dialog :deep(.el-dialog) {
  transform: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.transaction-form-dialog :deep(.el-dialog__body) {
  padding-top: 10px;
  padding-bottom: 10px;
}

.transaction-form-dialog :deep(.el-dialog__header) {
  padding: 20px;
  margin-right: 0;
  border-bottom: 1px solid #f0f0f0;
  background: #f8f9fa;
}

.transaction-form-dialog :deep(.el-dialog__title) {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.dialog-footer {
  padding: 20px;
  text-align: right;
  border-top: 1px solid #f0f0f0;
  margin: 0 -20px;
}

/* 响应式布局 */
@media screen and (max-width: 768px) {
  .transaction-form-dialog {
    width: 90% !important;
  }
}

/* 输入框激活状态 */
.el-input:focus-within,
.el-select:focus-within {
  transform: translateY(-1px);
  transition: transform 0.2s ease;
}

/* 按钮悬停效果 */
.el-button {
  transition: all 0.3s ease;
}

.el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 表单验证错误样式 */
.el-form-item.is-error {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

/* 输入框聚焦效果 */
.el-input:focus-within,
.el-select:focus-within,
.el-textarea:focus-within {
  transform: translateY(-1px);
  transition: transform 0.2s ease;
}

.el-input.is-active,
.el-select.is-active,
.el-textarea.is-active {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

/* 日期选择器样式优化 */
.el-date-picker {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 按钮动画效果增强 */
.dialog-footer .el-button {
  position: relative;
  overflow: hidden;
}

.dialog-footer .el-button::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.3s, height 0.3s;
}

.dialog-footer .el-button:active::after {
  width: 200px;
  height: 200px;
}

/* 表单项间距优化 */
.transaction-form .el-form-item {
  margin-bottom: 22px;
}

.transaction-form .el-form-item:last-child {
  margin-bottom: 0;
}

/* 描述文本域样式 */
.transaction-form .el-textarea__inner {
  transition: all 0.3s ease;
}

.transaction-form .el-textarea__inner:focus {
  border-color: #409EFF;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

/* 字数限制提示样式 */
.transaction-form :deep(.el-input__count) {
  background: transparent;
  font-size: 12px;
  color: #909399;
}
</style></style>
</style>
