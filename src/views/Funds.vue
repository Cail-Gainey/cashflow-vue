<template>
  <div class="funds-container">
    <h2 class="section-title">资产列表</h2>
    <el-card shadow="never" class="funds-card">
      <el-table
        :data="getFunds"
        style="width: 100%"
        :show-header="false"
        size="large"
        @row-click="handleRowClick"
        class="custom-table"
      >
        <el-table-column width="70">
          <template #default="scope">
            <div class="avatar-wrapper">
              <i :class="getIconByIndex(scope.$index)"></i>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="name">
          <template #default="scope">
            <span class="fund-name">{{ scope.row.name }}</span>
            <span class="fund-remark" v-if="scope.row.remark"> - {{ scope.row.remark }}</span>
          </template>
        </el-table-column>

        <el-table-column align="right" width="180">
          <template #default="scope">
            <span 
              class="fund-balance"
              :class="{ 'negative': scope.row.balance < 0 }"
            >
              ¥ {{ formatBalance(scope.row.balance) }}
            </span>
            <span v-if="scope.row.isCount === 0" class="not-included">(不计入)</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 总资产显示 -->
      <div class="total-assets">
        <div class="divider"></div>
        <div class="total-row">
          <span class="total-label">总资产</span>
          <span class="total-amount">¥ {{ formatBalance(totalBalance) }}</span>
        </div>
      </div>
    </el-card>
    
    <el-dialog :visible.sync="dialogVisible" width="600">
      <template #title>
        <div class="dialog-title">
          <span class="dialog-title-text">交易记录</span>
          <div class="dialog-buttons">
            <el-button 
              type="danger" 
              @click="confirmDeleteFund" 
              :disabled="selectedFund && selectedFund.name === '默认资产'"
              size="mini"
            >删除</el-button>
            <el-button 
              type="primary" 
              @click="editSelectedFund"
              size="mini"
            >修改</el-button>
          </div>
        </div>
      </template>
      <div v-if="selectedFund">
        <h3>{{ selectedFund.name }}</h3>
        <p>总资产: <strong style="color: #409EFF;">¥ {{ formatBalance(selectedFund.balance) }}</strong></p>
        <el-collapse v-model="activeMonths" accordion>
          <el-collapse-item 
            v-for="(transactions, month) in groupedTransactions" 
            :key="month" 
            :name="month"
          >
            <template #title>
              <div class="group-header">
                <h4>{{ month }}</h4>
                <div class="total-summary">
                  <el-tag type="danger">总支出: ¥ {{ formatAmount(totalExpense(month)) }}</el-tag>
                  <el-tag type="success">总收入: ¥ {{ formatAmount(totalIncome(month)) }}</el-tag>
                </div>
              </div>
            </template>
            <div class="transaction-list">
              <el-card 
                v-for="transaction in transactions" 
                :key="transaction.transactionId" 
                class="transaction-item"
                shadow="hover"
              >
                <div 
                  class="transaction-info" 
                  @click="handleTransactionClick(transaction)"
                >
                  <div class="transaction-details">
                    <span class="description">{{ transaction.categoryName }}</span>
                    <p>{{ new Date(transaction.time).toLocaleString('default', { month: 'numeric', day: 'numeric' }) }}</p>
                  </div>
                  <div class="transaction-amount-fund">
                    <div class="amount">
                      {{ transaction.type === 1 ? '-' : '+' }}{{ formatAmount(transaction.amount) }}
                    </div>
                    <el-tag v-if="transaction.fundName && transaction.fundName !== '未选择账号'" type="info" size="small">
                      {{ transaction.fundName }}
                    </el-tag>
                  </div>
                </div>
              </el-card>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </el-dialog>

    <!-- 记录详细信息的弹窗 -->
    <el-dialog :visible.sync="recordDialogVisible" width="400px">
      <template #title>
        <div class="dialog-title">
          <span class="dialog-title-text">账单详情</span>
          <div class="dialog-buttons">
            <el-button 
              type="danger" 
              @click="confirmDeleteRecord"
              size="mini"
            >删除</el-button>
            <el-button 
              type="primary" 
              @click="editSelectedRecord"
              size="mini"
            >修改</el-button>
          </div>
        </div>
      </template>
      <div v-if="selectedRecord" class="record-details">
        <p>
          <span class="label">金额:</span> 
          <span 
            class="value" 
            :class="{ 'expense': selectedRecord.type === 1, 'income': selectedRecord.type === 2 }"
          >
            {{ formatAmount(selectedRecord.amount) }}
          </span>
        </p>
        <p><span class="label">分类:</span> <span class="value">{{ selectedRecord.categoryName }}</span></p>
        <p><span class="label">支出账户:</span> <span class="value">{{ selectedRecord.fundName || '未选择账户' }}</span></p>
        <p><span class="label">时间:</span> <span class="value">{{ new Date(selectedRecord.time).toLocaleString() }}</span></p>
        <p><span class="label">备注:</span> <span class="value"> {{ selectedRecord.description }}</span></p>
      </div>
    </el-dialog>

    <!-- 底部居中显示的按钮 -->
    <div class="add-button-container">
      <el-button type="primary" icon="el-icon-plus" @click="showEditFundDialog" class="round-button"></el-button>
    </div>

    <!-- 新增资金的弹窗 -->
   <edit-fund-dialog
     v-if="isEditFundDialogVisible"
     :visible="isEditFundDialogVisible"
     :addFund="handleAddFund"
     :updateFund="handleUpdateFund"
     :isEditMode="isEditMode"
     :funds="getFunds"
     @close="isEditFundDialogVisible = false"
     ref="editFundDialog"
   />

   <!-- 新增交易的弹窗 -->
   <edit-transaction-dialog
     :visible.sync="isEditTransactionDialogVisible"
     :editing-transaction="selectedRecord"
     :ledgers="ledgers"
     :get-funds="getFunds"
     @transaction-saved="handleTransactionSaved"
     @update:visible="isEditTransactionDialogVisible = false"
   />
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import EditFundDialog from '@/components/EditFundDialog.vue';
import EditTransactionDialog from '@/components/EditTransactionDialog.vue';
import api from '@/api/api.js';

export default {
  components: {
    EditFundDialog,
    EditTransactionDialog,
  },
  data() {
    return {
      dialogVisible: false,
      selectedFund: null,
      activeMonths: [],
      detail: [],
      isEditFundDialogVisible: false,
      isEditMode: false,
      recordDialogVisible: false,
      selectedRecord: null,
      isEditTransactionDialogVisible: false,
    };
  },
  computed: {
    ...mapGetters(['getFunds', 'getUserInfo', 'ledgers']),
    totalBalance() {
      return this.getFunds.reduce((sum, fund) => {
        return fund.isCount !== 0 ? sum + fund.balance : sum;
      }, 0);
    },
    groupedTransactions() {
      if (!this.selectedFund || !this.selectedFund.transactions) return {};
      return this.groupTransactionsByMonth(this.selectedFund.transactions);
    }
  },
  methods: {
    ...mapActions(['getDetail']),
    formatBalance(balance) {
      return Number(balance).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    formatAmount(amount) {
      return Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    groupTransactionsByMonth(transactions) {
      return transactions.reduce((acc, transaction) => {
        const date = new Date(transaction.time);
        const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!acc[month]) {
          acc[month] = [];
        }
        acc[month].push(transaction);
        return acc;
      }, {});
    },
    getIconByIndex(index) {
      const icons = [
        'el-icon-wallet',
        'el-icon-bank-card',
        'el-icon-money',
        'el-icon-coin',
        'el-icon-credit-card',
        'el-icon-goods',
        'el-icon-present',
        'el-icon-shopping-bag'
      ];
      return icons[index % icons.length];
    },
    handleRowClick(row) {
      this.dialogVisible = true;
      this.selectedFund = row;
      this.getDetail(row.id).then(() => {
        this.selectedFund = { ...this.selectedFund, transactions: this.$store.getters.detail };
      });
    },
    totalExpense(month) {
      const transactions = this.groupedTransactions[month];
      return transactions.reduce((sum, transaction) => {
        if (transaction.type === 1) {
          return sum + transaction.amount;
        }
        return sum;
      }, 0);
    },
    totalIncome(month) {
      const transactions = this.groupedTransactions[month];
      return transactions.reduce((sum, transaction) => {
        if (transaction.type === 2) {
          return sum + transaction.amount;
        }
        return sum;
      }, 0);
    },
    showEditFundDialog() {
      this.isEditMode = false;
      this.isEditFundDialogVisible = true;
    },
    async handleAddFund(fund) {
      try {
        const userId = this.getUserInfo.id;
        await api.addFund(userId, fund);
        await this.$store.dispatch('getFunds');
        this.$message.success('新增资金成功');
      } catch (error) {
        console.error('新增资金失败:', error);
        this.$message.error(`新增资金失败: ${error.message || '未知错误'}`);
      }
    },
    async handleUpdateFund(fund) {
      try {
        const userId = this.getUserInfo.id;
        const fundId = this.selectedFund.id;
        await api.updateFund(userId, fundId, fund);
        await this.$store.dispatch('getFunds');
        this.dialogVisible = false;
        this.$message.success('更新资金成功');
      } catch (error) {
        console.error('更新资金失败:', error);
        this.$message.error(`更新资金失败: ${error.message || '未知错误'}`);
      }
    },
    editSelectedFund() {
      this.isEditMode = true;
      this.isEditFundDialogVisible = true;
      this.$nextTick(() => {
        if (this.$refs.editFundDialog && typeof this.$refs.editFundDialog.setFund === 'function') {
          this.$refs.editFundDialog.setFund(this.selectedFund, this.selectedFund.name === '默认资产');
        }
      });
    },
    async handleDeleteFund() {
      try {
        const userId = this.getUserInfo.id;
        const fundId = this.selectedFund.id;
        await api.deleteFund(userId, fundId);
        await this.$store.dispatch('getFunds');
        this.dialogVisible = false;
        this.$message.success('删除资金成功');
      } catch (error) {
        console.error('删除资金失败:', error);
        this.$message.error(`删除资金失败: ${error.message || '未知错误'}`);
      }
    },
    confirmDeleteFund() {
      if (this.selectedFund.name === '默认资产') {
        this.$message({
          type: 'warning',
          message: '默认资产不能删除'
        });
        return;
      }
      this.$confirm('此操作将永久删除该资金, 是否继续?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.handleDeleteFund();
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消删除'
        });
      });
    },
    handleTransactionClick(transaction) {
      this.selectedRecord = transaction;
      this.recordDialogVisible = true;
    },
    async deleteTransaction(transactionId) {
      try {
        await api.deleteTransaction(transactionId);
        this.$message.success('删除成功');
        this.handleTransactionSaved(); // 更新数据
      } catch (error) {
        console.error('删除交易记录失败:', error);
        this.$message.error(`删除失败: ${error.message || '未知错误'}`);
      }
    },
    confirmDeleteRecord() {
      if (!this.selectedRecord) return;
      this.$confirm('此操作将永久删除该记录, 是否继续?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.deleteTransaction(this.selectedRecord.id);
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消删除'
        });
      });
    },
    editSelectedRecord() {
      this.isEditTransactionDialogVisible = true;
    },
    handleTransactionSaved() {
      this.recordDialogVisible = false;
      this.isEditTransactionDialogVisible = false;
      // 重新获取资金详情以更新数据
      if (this.selectedFund) {
        this.getDetail(this.selectedFund.id).then(() => {
          this.selectedFund = { ...this.selectedFund, transactions: this.$store.getters.detail };
        });
      }
    },
  }
};
</script>

<style scoped>
.funds-container {
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 25px;
}

.funds-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.custom-table {
  --el-table-border-color: #ebeef5;
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table__row) {
  height: 60px;
  transition: background-color 0.3s;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa !important;
}

:deep(.el-table__cell) {
  padding: 8px;
}

:deep(.el-table .cell) {
  padding: 0 12px;
  display: flex;
  align-items: center;
  height: 100%;
  white-space: nowrap;
}

.fund-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-left: 8px;
}

.fund-remark {
  font-size: 14px;
  color: #909399;
  margin-left: 4px;
}

.fund-balance {
  font-size: 16px;
  font-weight: 600;
  color: #67C23A;
}

.fund-balance.negative {
  color: #F56C6C;
}

.not-included {
  font-size: 14px;
  color: #909399;
  margin-left: 4px;
}

.total-assets {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.1);
}

.divider {
  height: 1px;
  background-color: #EBEEF5;
  margin-bottom: 20px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-label {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.total-amount {
  font-size: 20px;
  font-weight: 700;
  color: #409EFF;
}

.avatar-wrapper {
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  border-radius: 50%;
  background-color: #409EFF;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  line-height: 1;
  flex-shrink: 0;
  margin: 0 auto;
}

.avatar-wrapper i {
  font-size: 16px;
  line-height: 1;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 10px 0;
  padding: 10px;
  background-color: #f5f5f5;
  cursor: pointer;
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s;
  height: auto;
  overflow: hidden;
}

.group-header:hover {
  background-color: #e0e0e0;
}

.el-collapse-item {
  margin-bottom: 10px;
  overflow: hidden;
}

.total-summary {
  display: flex;
  align-items: center;
}

.total-summary .el-tag {
  margin-left: 10px;
}

.transaction-list {
  margin-top: 10px;
}

.transaction-item {
  margin-bottom: 10px;
}

.transaction-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.transaction-amount-fund {
  display: flex;
  align-items: center;
}

.transaction-details {
  margin-top: 10px;
}

.add-button-container {
  position: fixed;
  bottom: 20px;
  right: 50%;
  transform: translateX(50%);
  z-index: 1000;
}

.round-button {
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.el-dialog__footer {
  display: flex;
  justify-content: space-between;
}

.dialog-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.dialog-title-text {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-weight: bold;
}

.dialog-buttons {
  margin-right: 40px;
}

.dialog-title .el-button {
  margin-left: 10px;
}

.record-details {
  display: flex;
  flex-direction: column;
}

.record-details p {
  display: flex;
  justify-content: space-between;
  margin: 5px 0;
}

.label {
  font-weight: bold;
  color: #303133;
}

.value {
  color: #606266;
}

.value.expense {
  color: #F56C6C; /* 红色，表示支出 */
}

.value.income {
  color: #67C23A; /* 绿色，表示收入 */
}
</style>