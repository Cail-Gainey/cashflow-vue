<template>
  <el-container>
    <el-aside :width="isMenuCollapsed ? '60px' : '200px'">
      <Menu @menu-clicked="changeView" @toggle-collapse="handleMenuCollapse" />
    </el-aside>
    <el-container>
      <el-header>
        <Header :current-view="currentView" />
      </el-header>
      <el-main>
        <Home 
          v-if="getViewName(currentView) === 'home'" 
          :transactions="transactions" 
          :ledgers="ledgers"
        />
        <Funds v-if="getViewName(currentView) === 'funds'" />
        <Ledgers v-if="getViewName(currentView) === 'ledgers'" />
        <Categories v-if="getViewName(currentView) === 'categories'" />
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import Menu from '../components/Menu.vue';
import Home from '../components/Home.vue';
import Funds from './Funds.vue';
import Ledgers from './Ledgers.vue';
import Header from '../components/Header.vue';
import Categories from './Categories.vue';
import { mapGetters } from 'vuex';

export default {
  components: {
    Menu,
    Home,
    Funds,
    Ledgers,
    Header,
    Categories
  },
  data() {
    return {
      transactions: [],
      currentView: '首页',
      isMenuCollapsed: false, // 菜单折叠状态
    };
  },
  computed: {
    ...mapGetters(['ledgers']), 
  },
  methods: {
    changeView(tagName) {
      this.currentView = tagName;
    },
    getViewName(tagName) {
      const menuItem = this.$store.getters.menuItems.find(item => item.name === tagName);
      return menuItem ? menuItem.viewName.toLowerCase() : tagName.toLowerCase();
    },
    handleMenuCollapse(isCollapsed) {
      this.isMenuCollapsed = isCollapsed;
    }
  },
  created() {
    this.$store.dispatch('getUserInfo');
  },
};
</script>

<style scoped>
  /* 禁止页面滚动 */
  body {
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  /* 设置 el-container 高度为 100% */
  .el-container {
    height: 100vh; /* 视口高度 */
    display: flex;
  }

  /* 设置 el-aside 高度和宽度 */
  .el-aside {
    width: 200px; /* 固定宽度 */
    background-color: #a2aab1;
    text-align: center;
    flex-shrink: 0; /* 防止 aside 被压缩 */
    overflow: hidden; /* 禁止内容溢出 */
  }

  /* 设置 el-header 高度 */
  .el-header {
    background-color: #B3C0D1;
    text-align: center;
    line-height: 60px;
    flex-shrink: 0; /* 防止 header 被压缩 */
  }

  /* 设置 el-main 高度自适应 */
  .el-main {
    background-color: #E9EEF3;
    text-align: center;
    flex-grow: 1; /* 填充剩余空间 */
    overflow: auto; /* 允许 el-main 内部滚动 */
    padding: 20px; /* 添加内边距 */
  }
</style>