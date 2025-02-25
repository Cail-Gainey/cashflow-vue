<template>
  <div class="category-container">
    <!-- 使用 el-tabs 实现顶部分类切换 -->
    <el-tabs v-model="activeTab" @tab-click="switchTab" class="centered-tabs" type="card">
      <el-tab-pane label="支出" name="1">
        <span slot="label"><i class="el-icon-money"></i> 支出</span>
      </el-tab-pane>
      <el-tab-pane label="收入" name="2">
        <span slot="label"><i class="el-icon-wallet"></i> 收入</span>
      </el-tab-pane>
    </el-tabs>

    <!-- 一级分类 -->
    <div class="category-wrapper">
      <el-row 
        v-for="(row, rowIndex) in categoryRows" 
        :key="rowIndex" 
        :gutter="20"
        class="category-row"
      >
        <el-col 
          v-for="category in row" 
          :key="category.id" 
          :span="6"
        >
          <el-card
            shadow="hover"
            :class="{ 
              'is-selected': selectedCategoryId === category.id,
              'is-expanded': expandedCategoryId === category.id 
            }"
            @click.native="selectCategory(category, rowIndex)"
          >
            <div class="category-card-content">
              <span class="category-name">{{ category.name }}</span>
              <el-tooltip 
                v-if="category.children && category.children.length > 0"
                :content="expandedCategoryId === category.id ? '收起子分类' : '展开子分类'"
                placement="top"
              >
                <i class="el-icon-arrow-down more-icon" 
                   :class="{ 'is-expanded': expandedCategoryId === category.id }">
                </i>
              </el-tooltip>
            </div>
          </el-card>
        </el-col>

        <!-- 展开的二级分类区域 -->
        <el-col :span="24" v-if="expandedCategoryId && expandedRowIndex === rowIndex">
          <el-collapse-transition>
            <div class="expanded-categories">
              <el-row :gutter="15">
                <el-col 
                  v-for="subCategory in currentCategoryChildren"
                  :key="subCategory.id"
                  :xs="12"
                  :sm="8"
                  :md="6"
                  :lg="4"
                >
                  <el-card
                    shadow="hover"
                    :class="{ 'is-selected': selectedSubCategoryId === subCategory.id }"
                    @click.native.stop="selectSubCategory(subCategory)"
                  >
                    <div class="sub-category-name">{{ subCategory.name }}</div>
                  </el-card>
                </el-col>
              </el-row>
            </div>
          </el-collapse-transition>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
import api from '@/api/api';
import { mapGetters } from 'vuex';

export default {
  name: 'Categories',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    defaultCategory: {
      type: Object,
      default: () => null
    }
  },
  data() {
    return {
      categories: [], // 所有分类数据
      filteredCategories: [], // 当前显示的过滤后的分类数据
      expandedCategoryId: null, // 当前展开的一级分类 ID
      expandedRowIndex: null, // 记录展开的行索引
      activeTab: '1', // 当前选中的标签页（默认显示支出）
      selectedCategoryId: null, // 添加选中分类的 ID
      selectedSubCategoryId: null, // 添加选中子类的 ID
    };
  },
  computed: {
    ...mapGetters(['getUserInfo']),
    // 将分类数据按每行4个进行分组
    categoryRows() {
      const rows = [];
      for (let i = 0; i < this.filteredCategories.length; i += 4) {
        rows.push(this.filteredCategories.slice(i, i + 4));
      }
      return rows;
    },
    // 当前展开的一级分类的子分类
    currentCategoryChildren() {
      const category = this.categories.find(
        (cat) => cat.id === this.expandedCategoryId
      );
      return category ? category.children : [];
    },
  },
  watch: {
    defaultCategory: {
      immediate: true,
      handler(category) {
        if (category) {
          // 设置当前标签页
          this.activeTab = category.type.toString();
          // 根据类型过滤分类数据
          this.filteredCategories = this.categories.filter(
            (cat) => cat.type === parseInt(category.type)
          );
          // 查找并选中对应的分类
          const parentCategory = this.categories.find(cat => 
            cat.children && cat.children.some(child => child.id === category.id)
          );
          if (parentCategory) {
            // 如果是二级分类
            this.expandedCategoryId = parentCategory.id;
            this.selectedCategoryId = parentCategory.id;
            this.selectedSubCategoryId = category.id;
          } else {
            // 如果是一级分类
            this.selectedCategoryId = category.id;
            this.selectedSubCategoryId = null;
          }
        }
      }
    }
  },
  async created() {
    await this.$store.dispatch('getUserInfo');
    const userId = this.getUserInfo.id;
    // 页面加载时获取所有分类
    await this.fetchCategories(userId);
    // 默认显示支出分类
    this.switchTab({ name: '1' });
  },
  methods: {
    // 获取分类
    async fetchCategories(userId) {
      try {
        const response = await api.getCategory(userId);
        this.categories = response.map((category) => ({
          ...category,
          hasChildren: category.children && category.children.length > 0, // 标记是否有二级分类
          children: category.children || [], // 初始化二级分类为空数组
        }));
      } catch (error) {
        console.error('获取分类失败:', error);
      }
    },

    // 切换标签页
    switchTab(tab) {
      this.activeTab = tab.name;
      // 根据类型过滤分类数据
      this.filteredCategories = this.categories.filter(
        (category) => category.type === parseInt(tab.name)
      );
      // 收起所有展开的分类
      this.expandedCategoryId = null;
      this.expandedRowIndex = null;
      // 新增：关闭另一个类型的所有二级分类
      this.categories.forEach(category => {
        if (category.type !== parseInt(tab.name)) {
          category.children.forEach(subCategory => {
            subCategory.expanded = false;
          });
        }
      });
    },

    // 选择一级分类
    selectCategory(category, rowIndex) {
      if (this.expandedCategoryId === category.id) {
        // 如果点击的是当前已展开的分类，则收起
        this.expandedCategoryId = null;
        this.expandedRowIndex = null;
      } else if (category.hasChildren) {
        // 如果点击的分类有二级分类，则展开新的一级分类，并收起之前的
        this.expandedCategoryId = category.id;
        this.expandedRowIndex = rowIndex;
      } else {
        // 如果点击的分类没有二级分类，则直接收起
        this.expandedCategoryId = null;
        this.expandedRowIndex = null;
      }

      // 无论是否有二级分类，都更新选中状态
      this.selectedCategoryId = category.id;
      this.$emit('categorySelected', category.id, category.type);
    },

    // 选择二级分类
    selectSubCategory(category) {
      this.selectedSubCategoryId = category.id;
      this.$emit('categorySelected', category.id, category.type);
    },
  },
};
</script>

<style scoped>
.category-container {
  padding: 20px;
}

.centered-tabs {
  margin-bottom: 20px;
}

.centered-tabs :deep(.el-tabs__header) {
  margin-bottom: 25px;
}

.centered-tabs :deep(.el-tabs__item) {
  font-size: 16px;
  height: 40px;
  line-height: 40px;
}

.centered-tabs :deep(.el-tabs__item.is-active) {
  font-weight: 600;
}

.centered-tabs :deep(.el-icon-money),
.centered-tabs :deep(.el-icon-wallet) {
  margin-right: 5px;
}

.category-wrapper {
  margin: 0 -10px;
}

.category-row {
  margin-bottom: 20px;
  position: relative;
}

.category-row:last-child {
  margin-bottom: 0;
}

.el-card {
  border-radius: 8px;
  border: 1px solid #EBEEF5;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.el-card:hover {
  transform: translateY(-2px);
}

.el-card.is-selected {
  border: 2px solid #409EFF;
  background-color: #ecf5ff;
}

.el-card.is-expanded {
  border-color: #409EFF;
  background-color: #ecf5ff;
}

.category-card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
}

.category-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.more-icon {
  font-size: 16px;
  color: #909399;
  transition: transform 0.3s ease;
}

.more-icon.is-expanded {
  transform: rotate(180deg);
}

.expanded-categories {
  width: 100%;
  margin-top: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.sub-category-name {
  font-size: 14px;
  text-align: center;
  color: #606266;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* Element UI 过渡动画自定义 */
.el-collapse-transition-enter-active,
.el-collapse-transition-leave-active {
  transition: all 0.3s ease-in-out;
  transform-origin: top;
}

.el-collapse-transition-enter,
.el-collapse-transition-leave-to {
  opacity: 0;
  transform: scaleY(0);
}

.el-collapse-transition-enter-to,
.el-collapse-transition-leave {
  opacity: 1;
  transform: scaleY(1);
}

/* 卡片内容边距调整 */
:deep(.el-card__body) {
  padding: 15px;
}

/* 确保子分类卡片样式一致 */
.expanded-categories .el-card {
  height: 100%;
  margin-bottom: 15px;
}

.expanded-categories .el-row {
  margin-bottom: -15px;
}

.expanded-categories .el-card__body {
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>