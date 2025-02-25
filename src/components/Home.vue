<template>
  <div>
    <div class="current-ledger-card">
      <el-card :style="{ backgroundImage: currentLedger && currentLedger.img ? `url(${currentLedger.img})` : 'rgb(200, 200, 200)', backgroundSize: 'cover', backgroundPosition: 'center' }">
        <div class="ledger-info">
          <div>
            <el-button class="switch-ledger-button" @click="openLedgerDialog()">
              {{ currentLedgerName }}
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <el-dialog :visible.sync="ledgerDialogVisible" width="50%" @close="resetLedgerDialog" :close-on-click-modal="true" append-to-body>
      <Ledgers 
        :ledgers="ledgers" 
        :currentLedger="currentLedger" 
        @ledger-selected="handleLedgerSelected"
      />
    </el-dialog>

    <el-button 
      class="add-transaction-button" 
      type="primary" 
      icon="el-icon-plus" 
      circle 
      @click="openEditTransactionDialog"
    ></el-button>

    <div v-if="groupedTransactions.length === 0" class="no-transactions">
      <i class="el-icon-warning-outline" style="font-size: 48px; color: #c0c4cc;"></i>
      <p style="font-size: 18px; color: #909399; margin-top: 10px;">暂无账单</p>
      <p style="color: #c0c4cc;">请添加新的交易记录</p>
    </div>
    <TransactionList 
      v-else
      :groupedTransactions="groupedTransactions" 
      :openDialog="openDialog" 
      @ledger-selected="handleLedgerSelected" 
    />

    <TransactionDialog 
      :visible.sync="dialogVisible" 
      :currentTransaction="currentTransaction" 
      @transaction-saved="fetchTransactions"
      @edit-transaction="handleEdit"
    />

    <EditTransactionDialog 
      :visible.sync="newDialogVisible" 
      :ledgers="ledgers" 
      :getFunds="getFunds" 
      :editingTransaction="editingTransaction"
      @transaction-saved="fetchTransactions" 
    />
  </div>
</template>

<script>
import api from '@/api/api';
import dayjs from 'dayjs';
import { mapGetters, mapActions } from 'vuex';
import TransactionDialog from './TransactionDialog.vue';
import EditTransactionDialog from './EditTransactionDialog.vue';
import TransactionList from './TransactionList.vue';
import Ledgers from './LedgersComponent.vue';
dayjs.locale('zh-cn');

export default {
  components: {
    TransactionDialog,
    EditTransactionDialog,
    TransactionList,
    Ledgers,
  },
  props: {
    transactions: {
      type: Array,
      default: () => []
    },
    ledgers: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      selectedLedger: null,
      dialogVisible: false,
      currentTransaction: null,
      newDialogVisible: false,
      editingTransaction: null,
      localTransactions: [],
      ledgerDialogVisible: false,
    };
  },
  watch: {
    transactions: {
      immediate: true,
      handler(newVal) {
        this.localTransactions = newVal;
      }
    }
  },
  computed: {
    ...mapGetters(['currentLedger', 'getUserInfo', 'getFunds']),
    currentLedgerName() {
      return this.currentLedger && this.currentLedger.name ? this.currentLedger.name : '无账本';
    },
    groupedTransactions() {
      const groups = {};
      this.localTransactions.forEach(transaction => {
        const date = transaction.time.split(' ')[0];
        if (!groups[date]) {
          groups[date] = {
            date: date,
            totalAmount: 0,
            transactions: []
          };
        }
        groups[date].transactions.push(transaction);
        groups[date].totalAmount += transaction.amount;
      });
      return Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date));
    },
  },
  methods: {
    ...mapActions(['changeLedger']),
    async fetchTransactions() {
      try {
        const userId = this.getUserInfo.id; 
        const ledgerId = this.selectedLedger;
        const response = await api.getTransactionById(userId, ledgerId);
        if (response) {
          this.localTransactions = response || [];
          this.localTransactions.sort((a, b) => new Date(b.time) - new Date(a.time));
        }
      } catch (error) {
        console.error('获取交易记录失败:', error);
        this.$message.error('获取交易记录失败，请稍后重试');
      }
    },
    openLedgerDialog() {
      this.ledgerDialogVisible = true;
    },
    openDialog(transaction) {
      this.currentTransaction = transaction;
      this.dialogVisible = true;
    },
    openEditTransactionDialog() {
      this.editingTransaction = null;
      this.newDialogVisible = true;
    },
    handleEdit(transaction) {
      this.editingTransaction = transaction;
      this.newDialogVisible = true;
    },
    handleLedgerSelected(ledger) {
      this.changeLedger(ledger);
      this.selectedLedger = ledger.id; 
      this.fetchTransactions(); 
      this.ledgerDialogVisible = false; 
    },
    resetLedgerDialog() {
      if (!this.currentLedger) {
        const initialLedger = this.ledgers.find(ledger => ledger.name === '初始账本');
        if (initialLedger) {
          this.changeLedger(initialLedger);
        }
      }
    },
  },
  async created() {
    await this.$store.dispatch('getUserInfo');
    await this.$store.dispatch('getFunds');

    if (this.ledgers.length > 0) {
      const initialLedger = this.ledgers.find(ledger => ledger.name === '初始账本');
      if (initialLedger) {
        this.changeLedger(initialLedger);
        this.selectedLedger = initialLedger.id;
        this.fetchTransactions();
      }
    }

    const userId = this.getUserInfo.id;
    const ledgerId = this.selectedLedger;
    try {
      const response = await api.getTransactionById(userId, ledgerId);
      if (response) {
        this.localTransactions = response || [];
        this.localTransactions.sort((a, b) => new Date(b.time) - new Date(a.time));
      }
    } catch (error) {
      console.error('获取交易记录失败:', error);
      this.$message.error('获取交易记录失败，请稍后重试');
    }
  },
};
</script>

<style scoped>
.transaction-group {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
}

.date {
  font-weight: bold;
  font-size: 16px;
  color: #333;
}

.total-summary {
  display: flex;
  gap: 10px;
}

.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #ebeef5;
}

.transaction-item:last-child {
  border-bottom: none;
}

.transaction-info {
  display: flex;
  align-items: center;
}

.dot {
  margin-right: 8px;
  font-size: 16px;
}

.description {
  font-size: 14px;
  color: #606266;
}

.transaction-amount-fund {
  display: flex;
  align-items: center;
  gap: 10px;
}

.amount {
  font-weight: bold;
  font-size: 14px;
}

.transaction-item.expense .amount {
  color: #f56c6c;
}

.transaction-item.income .amount {
  color: #67c23a;
}

.el-tag {
  margin-left: 10px;
}

.add-transaction-button {
  position: fixed;
  bottom: 20px;
  right: 50%;
  transform: translateX(50%);
  z-index: 1000;
}

.current-ledger-card {
  margin-bottom: 20px;
}

.switch-ledger-button {
  margin-top: 10px;
}
</style>