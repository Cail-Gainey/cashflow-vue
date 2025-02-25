<template>
  <div class="menu-container">
    <el-button class="collapse-button" @click="toggleCollapse">
      <i :class="isCollapsed ? 'fas fa-bars' : 'fas fa-chevron-left'"></i>
    </el-button>
    <el-menu :class="['menu', { collapsed: isCollapsed }]">
      <el-menu-item
        v-for="item in menuItems"
        :key="item.viewName"
        :index="item.viewName"
        @click="navigateTo(item.viewName)"
      >
        <i :class="item.icon" class="menu-icon"></i>
        <span v-if="!isCollapsed">{{ item.name }}</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'Menu',
  data() {
    return {
      isCollapsed: false
    };
  },
  computed: {
    ...mapGetters(['menuItems'])
  },
  methods: {
    navigateTo(viewName) {
      this.$emit('menu-clicked', viewName);
    },
    toggleCollapse() {
      this.isCollapsed = !this.isCollapsed;
      this.$emit('toggle-collapse', this.isCollapsed);
    }
  }
};
</script>

<style scoped>
@import '~@fortawesome/fontawesome-free/css/all.css';

.menu-container {
  position: relative;
}

.collapse-button {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  background: transparent;
  border: none;
  cursor: pointer;
  transform: translateY(-50%);
}

.menu {
  width: 220px;
  background: linear-gradient(to bottom, #ffffff, #e6e6e6);
  padding: 50px 25px 25px;
  box-shadow: 3px 0 8px rgba(0, 0, 0, 0.15);
  height: 100vh;
  overflow-y: auto;
  font-family: 'Verdana', sans-serif;
  border-right: 2px solid #cccccc;
  transition: width 0.3s ease;
}

.menu.collapsed {
  width: 60px;
  padding: 50px 10px 25px;
}

.el-menu-item {
  transition: background-color 0.3s ease, transform 0.3s ease;
  font-size: 16px;
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 5px;
  display: flex;
  align-items: center;
}

.menu-icon {
  margin-right: 10px;
  font-size: 18px;
}

.el-menu-item:hover {
  background-color: #b3b3b3;
  transform: scale(1.05);
}
</style> 