<template>
  <div class="ledgers-container">
    <div v-for="ledger in ledgers" :key="ledger.id" class="ledger-item">
      <el-card 
        class="ledger-card" 
        :style="{ backgroundImage: ledger.img ? `url(${ledger.img})` : 'rgb(200, 200, 200)', backgroundSize: 'cover', backgroundPosition: 'center' }" 
        shadow="hover"
        @click.native="emitSelectedLedger(ledger)" 
      >
        <div class="ledger-content">
          <h3 class="ledger-name">{{ ledger.name }}</h3>
          <div class="ledger-remark" v-if="ledger.remark">
            {{ ledger.remark }}
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  data() {
    return {
      currentLedger: {},
      loading: false,
      page: 1,
      imageUrl: null,
      isNameEditable: true,
      nameExists: false,
      originalName: '',
    };
  },
  computed: {
    ...mapGetters(['ledgers']),
  },
  watch: {
    'currentLedger.name': function(newName) {
      if (this.modifyLedgerDialogVisible && newName === this.originalName) {
        this.nameExists = false;
      } else {
        this.nameExists = this.ledgers.some(ledger => ledger.name === newName);
      }
    },
  },
  methods: {
    emitSelectedLedger(ledger) {
      this.$emit('ledger-selected', ledger);
    },
    openModifyLedgerDialog(ledger) {
      this.currentLedger = { ...ledger };
      this.originalName = ledger.name;
      this.imageUrl = ledger.img;
      this.modifyLedgerDialogVisible = true;
      this.isNameEditable = ledger.name !== '初始账本';
      this.nameExists = false;
    },
   
  },
};
</script>

<style scoped>
.ledgers-container {
  overflow-y: auto;
  max-height: 400px;
}

.ledger-item {
  margin-bottom: 10px;
}

.ledger-card {
  height: 180px;
  margin-bottom: 20px;
  border: none;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.ledger-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1) !important;
}

:deep(.el-card__body) {
  height: 100%;
  padding: 0;
}

.ledger-content {
  height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: #fff;
  background: rgba(0, 0, 0, 0.2);
  transition: background 0.3s ease;
  position: relative;
}

.ledger-card:hover .ledger-content {
  background: rgba(0, 0, 0, 0.3);
}

.ledger-name {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 10px 0;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
}

.ledger-remark {
  font-size: 14px;
  opacity: 0.9;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
