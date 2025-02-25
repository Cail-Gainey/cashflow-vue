import Vue from 'vue';
import Vuex from 'vuex';
import api from '@/api/api.js';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    token: localStorage.getItem('token') || null,
    userInfo: JSON.parse(localStorage.getItem('userInfo')) || null,
    funds: JSON.parse(localStorage.getItem('funds')) || [],
    tags: ['首页'],
    menuItems: [
      { name: '首页', viewName: 'Home', icon: 'fas fa-home' },
      { name: '资产', viewName: 'Funds', icon: 'fas fa-wallet' },
      { name: '账本', viewName: 'Ledgers', icon: 'fas fa-book' },
      { name: '分类', viewName: 'Categories', icon: 'fas fa-tags' }
    ],
    ledgers: null,
    detail: [],
    currentLedger: JSON.parse(localStorage.getItem('currentLedger')) || null,
    categories: [],
  },
  mutations: {
    setToken(state, token) {
      state.token = token;
    },
    setUserInfo(state, userInfo) {
      if (userInfo) {
        state.userInfo = userInfo;
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        localStorage.setItem('userId', userInfo.id);
      } else {
        console.error('token验证失败，请重新登录');
        state.userInfo = null;
      }
    },
    setFunds(state, funds) {
      state.funds = funds;
      localStorage.setItem('funds', JSON.stringify(funds));
    },
    addTag(state, tag) {
      if (!state.tags.includes(tag)) {
        state.tags.push(tag);
      }
    },
    removeTag(state, tag) {
      state.tags = state.tags.filter(t => t !== tag);
    },
    setMenuItems(state, menuItems) {
      state.menuItems = menuItems;
    },
    setLedgers(state, ledgers) {
      state.ledgers = ledgers;
    },
    setDetail(state, detail) {
      state.detail = detail;
    },
    setCurrentLedger(state, ledger) {
      state.currentLedger = ledger;
      localStorage.setItem('currentLedger', JSON.stringify(ledger));
    },
    setCategories(state, categories) {
      state.categories = categories;
    },
  },
  actions: {
     login({ commit, dispatch }, token) {
      commit('setToken', token);
      localStorage.setItem('token', token);
       dispatch('getUserInfo');
    },
    async logout({ commit }) {
      try {
        await api.logout();
      } catch (error) {
        console.error('Logout failed:', error);
        throw new Error(`退出失败: ${error.message || '未知错误'}`);
      } finally {
        // 清除本地存储
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('funds');
        localStorage.removeItem('ledgers');
        // 重置 Vuex 状态
        commit('setToken', null);
        commit('setUserInfo', null);
        commit('setFunds', null);
        commit('setLedgers', null);
      }
    },
    async getUserInfo({ commit, dispatch }) {
      try {
        const userInfo = await api.getUserInfo();
        commit('setUserInfo', userInfo);
        dispatch('getFunds');
        dispatch('getLedgers');
      } catch (error) {
        console.error('Failed to fetch user info:', error);
        throw new Error(`获取用户信息失败: ${error.message || '未知错误'}`);
      }
    },
    addTag({ commit }, tag) {
      commit('addTag', tag);
    },
    removeTag({ commit }, tag) {
      commit('removeTag', tag);
    },
    updateMenuItems({ commit }, menuItems) {
      commit('setMenuItems', menuItems);
    },
    async checkTokenExpired({ dispatch, state }) {
      if (!state.token) return true;
      try {
        const response = await api.verifyToken();
        if (response) {
          return false;
        }
        await dispatch('logout');
        return true;
      } catch (error) {
        await dispatch('logout');
        return true;
      }
    },
    async getLedgers({ commit, state }) {
      try {
        const ledgers = await api.getLedgerById(state.userInfo.id);
        commit('setLedgers', ledgers);
        localStorage.setItem('ledgers', JSON.stringify(ledgers));
      } catch (error) {
        console.error('获取账本失败:', error);
        throw new Error(`获取账本失败: ${error.message || '未知错误'}`);
      }
    },
    async getFunds({ commit, state }) {
      try {
        const funds = await api.getFundById(state.userInfo.id);
        localStorage.setItem('funds', JSON.stringify(funds));
        commit('setFunds', funds);
      } catch (error) {
        console.error('获取资金失败:', error);
        throw new Error(`获取资金失败: ${error.message || '未知错误'}`);
      }
    },
    async updateUserInfo({ commit }, userInfo) {
      const response = await api.updateUser(userInfo.id, userInfo);
      if (response) {
        commit('setUserInfo', userInfo);
      }
    },
    async getDetail({ commit, state }, fundId) {
      try {
        const response = await api.getDetail(state.userInfo.id, fundId);
        if (!response) {
          console.error('获取资金详情失败');
          return;
        }
        const detail = response || [];
        commit('setDetail', detail);
      } catch (error) {
        console.error('Error fetching fund detail:', error);
      }
    },
    changeLedger({ commit }, ledger) {
      commit('setCurrentLedger', ledger);
    },
    async updateLedgerAndRefresh({ dispatch }, { userId, updatedLedger }) {
      try {
        // 更新账本
        await api.updateLedger(userId, updatedLedger);
        // 成功后重新获取账本数据
        await dispatch('getLedgers');
      } catch (error) {
        console.error('更新账本并刷新失败:', error);
        throw error; // 抛出错误以便在组件中捕获
      }
    },
    async getCategories({ commit }, userId) {
      try {
        const categories = await api.getCategory(userId);
        commit('setCategories', categories);
      } catch (error) {
        console.error('获取分类失败:', error);
      }
    },
    async addCategory({ commit, dispatch, state }, { userId, formData }) {
      try {
        const newCategory = await api.addCategory(userId, formData);
        commit('setCategories', [...state.categories, newCategory]);
        // 添加分类后立即获取最新的分类数据
        await dispatch('getCategories', userId);
      } catch (error) {
        console.error('添加分类失败:', error);
      }
    },
    async updateCategory({ dispatch }, { userId, formData }) {
      try {
        await api.updateCategory(userId, formData);
        // 更新成功后，重新获取分类数据
        await dispatch('getCategories', userId);
      } catch (error) {
        console.error('更新分类失败:', error);
      }
    },
    async toChildren({ dispatch }, { userId, id, parentId }) {
      try {
        await api.toChildren(userId, id, parentId);
        await dispatch('getCategories', userId);
      } catch (error) {
        throw error;
      }
    },
    async deleteCategory({ dispatch }, { userId, id }) {
      try {
        await api.deleteCategory(userId, id);
        await dispatch('getCategories', userId);
      } catch (error) {
        throw error;
      }
    },
    async toParent({ dispatch }, { userId, id }) {
      try {
        await api.toParent(userId, id);
        await dispatch('getCategories', userId);
      } catch (error) {
        console.error('改为一级分类失败:', error);
        throw error;
      }
    },
    async countCategory({ commit }, { userId, id }) {
      try {
        const response = await api.countCategory(userId, id);
        return response;
      } catch (error) {
        console.error('获取分类账单记录失败:', error);
        throw error;
      }
    },
    async transferCategory({ dispatch }, { userId, oldId, newId }) {
      try {
        await api.transferCategory(userId, oldId, newId);
        await dispatch('getCategories', userId);
      } catch (error) {
        console.error('分类迁移失败:', error);
        throw error;
      }
    },
  },
  getters: {
    token: state => state.token,
    getUserInfo: state => state.userInfo,
    getFunds: state => state.funds,
    tags: state => state.tags,
    menuItems: state => state.menuItems,
    ledgers: state => state.ledgers,
    detail: state => state.detail,
    currentLedger: state => state.currentLedger,
    categories: state => state.categories,
  }
});
