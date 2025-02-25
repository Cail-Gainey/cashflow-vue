<template>
  <div>
    <el-card 
      v-for="group in groupedTransactions" 
      :key="group.date" 
      class="transaction-group"
    >
      <div class="group-header">
        <div class="date">{{ formatDate(group.date) }}</div>
        <div class="total-summary">
          <el-tag v-if="totalExpense[group.date] < 0" type="danger">支: {{ formatAmount(totalExpense[group.date]) }}</el-tag>
          <el-tag v-if="totalIncome[group.date] > 0" type="success">收: {{ formatAmount(totalIncome[group.date]) }}</el-tag>
        </div>
      </div>
      <el-divider></el-divider>
      <ul>
        <li 
          v-for="transaction in group.transactions" 
          :key="transaction.id" 
          class="transaction-item"
          :class="{ 'expense': transaction.type === 1, 'income': transaction.type === 2 }"
          @click="openDialog(transaction)"
        >
          <div class="transaction-info">
            <span class="dot">·</span>
            <span class="description">{{ transaction.description || transaction.categoryName }}</span>
          </div>
          <div class="transaction-amount-fund">
            <div class="amount">
              {{ transaction.type === 1 ? '-' : '+' }}{{ formatAmount(transaction.amount) }}
            </div>
            <el-tag v-if="transaction.fund && transaction.fund !== '未选择账号'" type="info" size="small">
              {{ transaction.fund }}
            </el-tag>
          </div>
        </li>
      </ul>
    </el-card>
  </div>
</template>

<script>
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
dayjs.locale('zh-cn');

export default {
  props: {
    groupedTransactions: {
      type: Array,
      required: true
    },
    openDialog: {
      type: Function,
      required: true
    }
  },

  methods: {
    formatDate(date) {
      const today = dayjs().format('YYYY-MM-DD');
      const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

      if (date === today) {
        return dayjs(date).format('M-DD') + ' 今天';
      } else if (date === yesterday) {
        return dayjs(date).format('M-DD') + ' 昨天';
      } else {
        return dayjs(date).format('M-DD dddd');
      }
    },

    formatAmount(amount) {
      return Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
  },

  computed: {
    totalExpense() {
      return this.groupedTransactions.reduce((acc, group) => {
        acc[group.date] = -group.transactions
          .filter(transaction => transaction.type === 1)
          .reduce((sum, transaction) => sum + transaction.amount, 0);
        return acc;
      }, {});
    },

    totalIncome() {
      return this.groupedTransactions.reduce((acc, group) => {
        acc[group.date] = group.transactions
          .filter(transaction => transaction.type === 2)
          .reduce((sum, transaction) => sum + transaction.amount, 0);
        return acc;
      }, {});
    }
  }
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
</style>