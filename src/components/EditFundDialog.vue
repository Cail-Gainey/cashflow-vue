<template>
  <el-dialog :title="dialogTitle" :visible.sync="localVisible" width="400px" @close="handleClose">
    <el-form :model="newFund" label-width="100px" label-position="left">
      <el-form-item label="名称">
        <el-input 
          v-model="newFund.name" 
          placeholder="请输入资金名称" 
          :disabled="isDefault"
        >
          <template v-if="nameExists" #append>
            <span style="color: red;">该资金已存在</span>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="余额">
        <el-input 
          v-model="newFund.balance" 
          type="text" 
          placeholder="请输入余额" 
          @input="formatBalanceInput"
        ></el-input>
      </el-form-item>
      <el-form-item label="备注">
        <el-input 
          v-model="newFund.remark" 
          placeholder="请输入备注" 
          maxlength="20" 
          show-word-limit
        ></el-input>
      </el-form-item>
      <el-form-item label="计入总资产">
        <el-switch
          v-model="newFund.isCount"
          :active-value="1"
          :inactive-value="0"
          active-text="是"
          inactive-text="否"
        ></el-switch>
      </el-form-item>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button @click="closeDialog">取 消</el-button>
      <el-button type="primary" @click="submitFund" style="background-color: #409EFF; color: white;">确 定</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
    addFund: {
      type: Function,
      required: true,
    },
    updateFund: {
      type: Function,
      required: true,
    },
    isEditMode: {
      type: Boolean,
      required: true,
    },
    funds: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      newFund: {
        name: '',
        balance: '0.00', // 默认值为0.00
        remark: '', // 新增的备注字段
        isCount: 1,
      },
      formLabelWidth: '100px',
      localVisible: this.visible, // Local visibility state
      isDefault: false, // 新增的状态变量
      nameExists: false, // 新增的状态变量，用于标记名称是否已存在
      originalName: '', // 新增的状态变量，用于保存原始名称
    };
  },
  computed: {
    dialogTitle() {
      return this.isEditMode ? '编辑资金' : '新增资金';
    }
  },
  watch: {
    'newFund.name': function(newName) {
      if (this.isEditMode && newName === this.originalName) {
        this.nameExists = false;
      } else {
        this.nameExists = this.funds.some(fund => fund.name === newName);
      }
    },
    visible(newVal) {
      this.localVisible = newVal;
    },
    localVisible(newVal) {
      if (!newVal) {
        this.$emit('close');
      }
    }
  },
  methods: {
    closeDialog() {
      this.localVisible = false; // 更新本地状态
    },
    handleClose() {
      this.localVisible = false;
      this.$emit('close');
      this.resetForm();
    },
    resetForm() {
      this.newFund = { name: '', balance: '0.00', remark: '', isCount: 1 };
      this.isDefault = false; // 重置状态
    },
    submitFund() {
      if (!this.newFund.name) {
        this.$message.error('名称不能为空');
        return;
      }
      if (this.newFund.name === '默认资产') {
        this.$message.error('名称不能为默认资产');
        return;
      }
      if (parseFloat(this.newFund.balance) < 0) {
        this.$message.error('余额不能为负数');
        return;
      }
      if (this.nameExists) {
        this.$message.error('该资金已存在');
        return;
      }
      if (this.isEditMode) {
        this.updateFund(this.newFund); // 调用更新资金的方法
      } else {
        this.addFund(this.newFund); // 调用添加资金的方法
      }
      this.closeDialog(); // 提交后关闭对话框
    },
    setFund(fund, isDefault = false) {
      this.newFund = { 
        name: fund.name, 
        balance: fund.balance.toFixed(2), 
        remark: fund.remark || '',
        isCount: fund.isCount || 0
      };
      this.originalName = fund.name; // 保存原始名称
      this.isDefault = isDefault;
      this.localVisible = true;
    },
    formatBalanceInput(event) {
      const value = event.target.value;
      const formattedValue = parseFloat(value).toFixed(2);
      if (!isNaN(formattedValue)) {
        this.newFund.balance = formattedValue;
      }
    }
  },
};
</script>

<style scoped>
.el-form-item__label {
  text-align: left !important; /* 强制左对齐 */
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
/* 隐藏输入框的上下箭头 */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
}
</style>