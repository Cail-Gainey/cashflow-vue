<template>
  <el-dialog 
    :visible.sync="isVisible" 
    width="500px" 
    custom-class="transaction-dialog"
    :title="currentTransaction ? currentTransaction.type === 1 ? '支出详情' : '收入详情' : '账单详情'"
    @close="handleClose"
  >
    <el-card shadow="never" class="transaction-card">
      <!-- 金额展示区域 -->
      <div class="amount-section">
        <span class="currency">¥</span>
        <span class="amount" :class="{'expense': currentTransaction?.type === 1}">
          {{ currentTransaction?.amount }}
        </span>
      </div>

      <!-- 主要信息区域 -->
      <div v-if="currentTransaction" class="info-grid">
        <div class="info-item">
          <i class="el-icon-collection-tag"></i>
          <span class="info-label">分类</span>
          <span class="info-value">{{ currentTransaction.categoryName }}</span>
        </div>
        <div class="info-item">
          <i class="el-icon-wallet"></i>
          <span class="info-label">资产</span>
          <span class="info-value">{{ currentTransaction.fundName }}</span>
        </div>
        <div class="info-item">
          <i class="el-icon-date"></i>
          <span class="info-label">时间</span>
          <span class="info-value">{{ currentTransaction.time }}</span>
        </div>
        <div class="info-item">
          <i class="el-icon-notebook-2"></i>
          <span class="info-label">账本</span>
          <span class="info-value">{{ currentTransaction.ledger }}</span>
        </div>
        <div class="info-item full-width">
          <i class="el-icon-document"></i>
          <span class="info-label">备注</span>
          <span class="info-value">{{ currentTransaction.description || '-' }}</span>
        </div>
      </div>
    </el-card>

    <!-- 底部按钮 -->
    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose">关闭</el-button>
      <el-button type="primary" @click="editTransaction">
        <i class="el-icon-edit"></i> 修改
      </el-button>
      <el-button type="danger" @click="deleteTransaction">
        <i class="el-icon-delete"></i> 删除
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import api from '@/api/api';

export default {
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    currentTransaction: {
      type: Object,
      default: () => null
    }
  },
  data() {
    return {
      isVisible: this.visible // 使用本地数据属性
    };
  },
  watch: {
    visible(newVal) {
      this.isVisible = newVal; // 监听 prop 的变化
    }
  },
  methods: {
    handleClose() {
      this.$emit('update:visible', false); // 关闭时更新父组件的 visible
    },
    async deleteTransaction() {
      try {
        const response = await api.deleteTransaction(this.currentTransaction.id);
        if (!response) {
          this.$message.error('删除失败');
          return;
        }
        this.$message.success('删除成功');
        this.$emit('transaction-saved'); // 通知父组件刷新数据
        this.handleClose();
      } catch (error) {
        this.$message.error('删除失败');
        console.error('删除交易记录失败:', error);
      }
    },
    editTransaction() {
      // 构造完整的交易记录对象
      const transactionData = {
        ...this.currentTransaction,
        categoryId: this.currentTransaction.categoryId || '', // 确保传递categoryId
        ledgerId: this.currentTransaction.ledgerId || '', // 确保传递ledgerId
        ledger: this.currentTransaction.ledger, // 保留ledger名称
        fundId: this.currentTransaction.fundId || '', // 确保传递fundId
        fundName: this.currentTransaction.fundName // 保留资产名称
      };
      this.$emit('edit-transaction', transactionData);
      this.handleClose(); // 关闭当前对话框
    }
  }
};
</script>

<style scoped>
.transaction-dialog {
  border-radius: 8px;
}

.transaction-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.transaction-card {
  margin: 0;
  border: none;
}

.transaction-card :deep(.el-card__body) {
  padding: 20px;
}

.amount-section {
  text-align: center;
  padding: 20px 0;
  margin-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.currency {
  font-size: 24px;
  color: #606266;
  margin-right: 4px;
}

.amount {
  font-size: 36px;
  font-weight: bold;
  color: #67C23A;
}

.amount.expense {
  color: #F56C6C;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-item.full-width {
  grid-column: span 2;
}

.info-item i {
  font-size: 16px;
  color: #909399;
}

.info-label {
  color: #909399;
  margin-right: 8px;
  font-size: 14px;
}

.info-value {
  color: #303133;
  font-size: 14px;
  flex: 1;
}

.dialog-footer {
  padding: 20px;
  text-align: right;
  border-top: 1px solid #f0f0f0;
}

/* 响应式布局 */
@media screen and (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .info-item.full-width {
    grid-column: span 1;
  }
}
</style>