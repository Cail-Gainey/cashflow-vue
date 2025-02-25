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
            @click.native="toggleExpandCategory(category, rowIndex)"
          >
            <div class="category-card-content">
              <span class="more-icon-container">
                <i class="el-icon-more" @click.stop="showMoreDialog(category)"></i>
              </span>
              <span class="category-name">{{ category.name }}</span>
              <span class="expand-icon-container">
                <i class="el-icon-arrow-down more-icon" 
                   :class="{ 'is-expanded': expandedCategoryId === category.id }">
                </i>
              </span>
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
                    <div class="sub-category-card-content">
                      <span class="sub-category-name">{{ subCategory.name }}</span>
                      <span class="sub-more-icon-container">
                        <i class="el-icon-more" @click.stop="showMoreDialog(subCategory)"></i>
                      </span>
                    </div>
                  </el-card>
                </el-col>
                <!-- 始终显示添加按钮 -->
                <el-col 
                  :xs="12"
                  :sm="8"
                  :md="6"
                  :lg="4"
                >
                  <el-card
                    shadow="hover"
                    @click.native.stop="showAddCategoryDialog('sub', expandedCategoryId)"
                  >
                    <div class="sub-category-name">添加子分类</div>
                  </el-card>
                </el-col>
              </el-row>
            </div>
          </el-collapse-transition>
        </el-col>
      </el-row>
      <div v-if="categoryRows.length === 0" class="no-category-message">
        <i class="el-icon-warning" style="font-size: 40px; color: #f56c6c;"></i>
        <p>暂无分类</p>
        <p>您可以通过点击下方按钮来添加新的分类。</p>
      </div>
    </div>

    <!-- 底部居中显示的按钮 -->
    <div class="add-button-container">
      <el-button 
        type="primary" 
        icon="el-icon-plus" 
        @click="showAddCategoryDialog('main')"
        class="round-button">
      </el-button>
    </div>

    <!-- 新增一级分类的弹窗 -->
    <el-dialog title="新增一级分类" :visible.sync="isAddMainCategoryDialogVisible" width="500px">
      <el-form :model="newMainCategory" label-width="100px">
        <el-form-item label="分类名称">
          <el-input v-model="newMainCategory.name"></el-input>
        </el-form-item>
        <el-form-item label="分类类型">
          <el-select v-model="newMainCategory.type" placeholder="请选择分类类型">
            <el-option label="支出" :value="1"></el-option>
            <el-option label="收入" :value="2"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="isAddMainCategoryDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="addMainCategory">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 新增二级分类的弹窗 -->
    <el-dialog title="新增二级分类" :visible.sync="isAddSubCategoryDialogVisible" width="500px">
      <el-form :model="newSubCategory" label-width="100px">
        <el-form-item label="一级分类">
          <el-input :placeholder="currentCategoryName" :disabled="true"></el-input>
        </el-form-item>
        <el-form-item label="二级分类">
          <el-input v-model="newSubCategory.name"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="isAddSubCategoryDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="addSubCategory">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 更多信息弹窗 -->
    <el-dialog :title="currentCategoryName" :visible.sync="isMoreDialogVisible" width="400px">
      <el-menu
        :default-active="activeMoreMenu"
        class="el-menu-vertical-demo"
        @select="handleMoreMenuSelect"
      >
        <el-menu-item index="edit">
          <i class="el-icon-edit"></i>
          <span slot="title">修改分类</span>
        </el-menu-item>
        <el-menu-item index="delete">
          <i class="el-icon-delete"></i>
          <span slot="title">删除分类</span>
        </el-menu-item>
        <el-menu-item index="change" v-if="!currentCategory.parentId">
          <i class="el-icon-swap"></i>
          <span slot="title">改为二级分类</span>
        </el-menu-item>
        <el-menu-item index="change" v-else>
          <i class="el-icon-swap"></i>
          <span slot="title">改为一级分类</span>
        </el-menu-item>
      </el-menu>
      <span slot="footer" class="dialog-footer">
        <el-button @click="isMoreDialogVisible = false">取 消</el-button>
      </span>
    </el-dialog>

    <!-- 修改分类名称的弹窗 -->
    <el-dialog title="修改分类名称" :visible.sync="isEditDialogVisible" width="500px">
      <el-form>
        <el-form-item label="分类名称" label-width="100px">
          <el-input v-model="currentCategory.name"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="closeEditDialog">取 消</el-button>
        <el-button type="primary" @click="saveCategory">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 改为二级分类的弹窗 -->
    <el-dialog title="改为二级分类" :visible.sync="isChangeToSubDialogVisible" width="500px">
      <el-form>
        <el-form-item label="选择一级分类" label-width="100px">
          <el-select v-model="selectedParentId" placeholder="请选择一级分类">
            <el-option
              v-for="category in parentCategories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="isChangeToSubDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="confirmChangeToSubCategory">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 选择新分类的弹窗 -->
    <el-dialog title="删除分类" :visible.sync="isSelectNewCategoryDialogVisible" width="500px">
      <el-form>
        <el-form-item label="删除的分类" label-width="100px">
          <el-input :value="currentCategory.name" disabled></el-input>
        </el-form-item>
        <el-form-item label="迁移到新的分类" label-width="100px">
          <el-cascader
            v-model="selectedNewCategoryId"
            :options="cascaderCategories"
            placeholder="请选择新分类"
            :props="cascaderProps"
          ></el-cascader>
        </el-form-item>
        <el-form-item>
          <p class="info-text">- 此分类下已有 {{ transactionCount }} 条账单</p>
          <p class="info-text">- 如果要删除【{{ currentCategory.name }}】分类，请给这些账单选择一个新的分类</p>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="isSelectNewCategoryDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="confirmNewCategorySelection">确 定</el-button>
      </span>
    </el-dialog>
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
      filteredCategories: [], // 当前显示的过滤后的分类数据
      expandedCategoryId: null, // 当前展开的一级分类 ID
      expandedRowIndex: null, // 记录展开的行索引
      activeTab: '1', // 当前选中的标签页（默认显示支出）
      selectedCategoryId: null, // 添加选中分类的 ID
      selectedSubCategoryId: null, // 添加选中子类的 ID
      isAddMainCategoryDialogVisible: false, // 控制新增一级分类弹窗显示
      isAddSubCategoryDialogVisible: false, // 控制新增二级分类弹窗显示
      isMoreDialogVisible: false, // 控制更多信息弹窗的显示
      isEditDialogVisible: false, // 控制修改对话框的显示
      isChangeToSubDialogVisible: false, // 控制改为二级分类弹窗显示
      isSelectNewCategoryDialogVisible: false, // 控制选择新分类的弹窗显示
      newMainCategory: { // 新增一级分类的数据模型
        name: '',
        type: null,
      },
      newSubCategory: { // 新增二级分类的数据模型
        name: '',
        type: null,
        parentId: null
      },
      formLabelWidth: '100px', // 表单标签宽度
      currentCategoryName: '', // 当前所点击的一级分类名称
      currentCategory: {
        id: null,
        name: '',
        type: null,
        parentId: null,
      },
      activeMoreMenu: '', // 默认选中的更多菜单项
      selectedParentId: null, // 选择的父分类 ID
      selectedNewCategoryId: null, // 选择的新的分类 ID
      transactionCount: 0, // 当前分类下的账单数量
    };
  },
  computed: {
    ...mapGetters(['getUserInfo', 'categories']),
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
    parentCategories() {
      // 获取除当前分类外的所有一级分类
      return this.categories.filter(
        (category) => category.id !== this.currentCategory.id && category.type === 1
      );
    },
    // 级联选择器的分类数据
    cascaderCategories() {
      const filterCategories = (categories) => {
        return categories
          .filter(category => category.id !== this.currentCategory.id && category.type === this.currentCategory.type)
          .map(category => ({
            value: category.id,
            label: category.name,
            children: category.children && category.children.length > 0
              ? category.children.map(subCategory => ({
                  value: subCategory.id,
                  label: subCategory.name
                }))
              : null
          }));
      };
      return filterCategories(this.categories);
    },
    cascaderProps() {
      return {
        checkStrictly: true,
        expandTrigger: 'hover',
        emitPath: false
      };
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
    // 页面加载时通过 Vuex 获取所有分类
    await this.$store.dispatch('getCategories', userId);
    // 默认显示支出分类
    this.switchTab({ name: '1' });
  },
  methods: {
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
    },
    // 切换展开状态
    toggleExpandCategory(category, rowIndex) {
      if (this.expandedCategoryId === category.id) {
        // 如果点击的是当前已展开的分类，则收起
        this.expandedCategoryId = null;
        this.expandedRowIndex = null;
      } else {
        // 展开新的一级分类，并收起之前的
        this.expandedCategoryId = category.id;
        this.expandedRowIndex = rowIndex;
      }
    },
    // 选择一级分类
    selectCategory(category, rowIndex) {
      // 设置当前分类
      this.currentCategory.id = category.id;
      this.currentCategory.name = category.name;
      this.currentCategory.type = category.type;
      this.currentCategory.parentId = category.parentId || null;

      // 无论是否有二级分类，都更新选中状态
      this.selectedCategoryId = category.id;
      this.currentCategoryName = category.name;
      this.showMoreDialog(category); // 显示更多信息弹窗
      this.$emit('categorySelected', category.id, category.type);
    },
    // 选择二级分类
    selectSubCategory(category) {
      this.selectedSubCategoryId = category.id;
      this.$emit('categorySelected', category.id, category.type);
    },
    // 显示新增分类弹窗
    showAddCategoryDialog(type, parentId = null) {
      if (type === 'main') {
        this.isAddMainCategoryDialogVisible = true;
      } else if (type === 'sub') {
        this.newSubCategory.parentId = parentId;
        this.newSubCategory.type = parseInt(this.activeTab);
        this.currentCategoryName = this.categories.find(cat => cat.id === parentId)?.name || '';
        this.isAddSubCategoryDialogVisible = true;
      }
    },
    // 显示更多信息弹窗
    showMoreDialog(category) {
      this.currentCategory.id = category.id;
      this.currentCategory.name = category.name;
      this.currentCategory.type = category.type;
      this.currentCategory.parentId = category.parentId || null;

      this.currentCategoryName = category.name; // 更新当前分类名称
      this.isMoreDialogVisible = true;
    },
    // 新增一级分类的方法
    async addMainCategory() {
      try {
        const userId = this.getUserInfo.id;
        const formData = new FormData();
        formData.append('name', this.newMainCategory.name);
        formData.append('type', this.newMainCategory.type);
        formData.append('parentId', null);
        
        await this.$store.dispatch('addCategory', { userId, formData });

        this.filteredCategories = this.categories.filter(
          (category) => category.type === parseInt(this.activeTab)
        );
      } catch (error) {
        console.error('新增一级分类失败:', error);
      }

      this.isAddMainCategoryDialogVisible = false;
      this.newMainCategory = { name: '', type: null };
    },
    // 新增二级分类的方法
    async addSubCategory() {
      try {
        const userId = this.getUserInfo.id;
        const formData = new FormData();
        formData.append('name', this.newSubCategory.name);
        formData.append('type', this.newSubCategory.type);
        formData.append('parentId', this.newSubCategory.parentId);

        await this.$store.dispatch('addCategory', { userId, formData });

        this.filteredCategories = this.categories.filter(
          (category) => category.type === parseInt(this.activeTab)
        );
      } catch (error) {
        console.error('新增二级分类失败:', error);
      }

      this.isAddSubCategoryDialogVisible = false;
      this.newSubCategory = { name: '', type: null, parentId: null };
    },
    // 修改分类
    async modifyCategory() {
      // 确保 currentCategory 已经被正确设置
      if (!this.currentCategory.id || !this.currentCategory.name) {
        console.error('分类 ID 和名称不能为空');
        return;
      }
      this.currentCategory.name = this.currentCategoryName; // 设置为当前分类名称
      this.isEditDialogVisible = true; // 显示修改对话框
    },
    // 删除分类
    async deleteCategory() {
      try {
        const userId = this.getUserInfo.id;
        const countResponse = await this.$store.dispatch('countCategory', {
          userId,
          id: this.currentCategory.id,
        });

        this.transactionCount = countResponse; // 设置账单数量

        if (countResponse > 0) {
          // 如果账单记录大于0，显示选择新分类的对话框
          this.isSelectNewCategoryDialogVisible = true;
        } else {
          // 如果账单记录为0，直接删除
          await this.$confirm('此操作将永久删除该分类, 是否继续?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          });

          await this.$store.dispatch('deleteCategory', {
            userId,
            id: this.currentCategory.id,
          });

          this.$message.success('分类已成功删除');
          this.isMoreDialogVisible = false; // 确保关闭更多信息弹窗
          await this.$store.dispatch('getCategories', userId);
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error(error.message);
          console.error('删除分类失败:', error);
        }
      }
    },
    async confirmNewCategorySelection() {
      try {
        const userId = this.getUserInfo.id;
        // 调用 transferCategory 方法进行分类迁移
        await this.$store.dispatch('transferCategory', {
          userId,
          oldId: this.currentCategory.id,
          newId: this.selectedNewCategoryId,
        });

        // 删除旧分类
        await this.$store.dispatch('deleteCategory', {
          userId,
          id: this.currentCategory.id,
        });

        this.$message.success('分类已成功删除并转移账单');
        this.isSelectNewCategoryDialogVisible = false;
        this.isMoreDialogVisible = false; // 确保关闭更多信息弹窗
        await this.$store.dispatch('getCategories', userId);

        // 更新组件的分类数据
        this.filteredCategories = this.categories.filter(
          (category) => category.type === parseInt(this.activeTab)
        );
      } catch (error) {
        this.$message.error('转移账单失败');
        console.error('转移账单失败:', error);
      }
    },
    // 改为二级分类
    changeToSubCategory() {
      this.isChangeToSubDialogVisible = true; // 显示改为二级分类弹窗
    },
    async confirmChangeToSubCategory() {
      if (!this.selectedParentId) {
        this.$message.error('请选择一个一级分类');
        return;
      }

      try {
        const userId = this.getUserInfo.id;
        await this.$store.dispatch('toChildren', {
          userId,
          id: this.currentCategory.id,
          parentId: this.selectedParentId,
        });

        this.$message.success('分类已成功改为二级分类');
        this.isChangeToSubDialogVisible = false;
        this.isMoreDialogVisible = false; // 关闭更多信息弹窗
        this.selectedParentId = null; // 清空选择
        await this.$store.dispatch('getCategories', userId); // 刷新分类列表

        // 更新组件的分类数据
        this.filteredCategories = this.categories.filter(
          (category) => category.type === parseInt(this.activeTab)
        );
      } catch (error) {
        this.$message.error(error.message);
        console.error('改为二级分类失败:', error);
        this.isChangeToSubDialogVisible = false; // 确保在失败时关闭弹窗
        this.selectedParentId = null; // 清空选择
      }
    },
    // 保存修改后的分类名称
    async saveCategory() {
      try {
        // 检查 id 和 name 是否为 null
        if (this.currentCategory.id === null || this.currentCategory.name.trim() === '') {
          console.error('分类 ID 和名称不能为空');
          return;
        }

        const userId = this.getUserInfo.id;
        const formData = new FormData();
        formData.append('id', this.currentCategory.id);
        formData.append('name', this.currentCategory.name);

        await this.$store.dispatch('updateCategory', { userId, formData });

        // 更新成功后，重新获取分类数据
        await this.$store.dispatch('getCategories', userId);

        // 更新组件的分类数据
        this.filteredCategories = this.categories.filter(
          (category) => category.type === parseInt(this.activeTab)
        );

        // 关闭弹窗
        this.isEditDialogVisible = false;
        this.isMoreDialogVisible = false;

      } catch (error) {
        console.error('保存分类名称失败:', error);
      }
    },
    // 关闭修改分类弹窗时重置输入
    closeEditDialog() {
      this.isEditDialogVisible = false;
      this.currentCategory.name = this.currentCategoryName; // 重置为当前分类名称
    },
    handleMoreMenuSelect(index) {
      this.activeMoreMenu = index;
      // 根据选中的菜单项执行相应的逻辑
      if (index === 'edit') {
        this.modifyCategory();
      } else if (index === 'delete') {
        this.deleteCategory();
      } else if (index === 'change') {
        if (this.currentCategory.parentId) {
          this.changeToMainCategory(); // 改为一级分类
        } else {
          this.changeToSubCategory(); // 改为二级分类
        }
      }
    },
    changeToMainCategory() {
      try {
        const userId = this.getUserInfo.id;
        this.$store.dispatch('toParent', {
          userId,
          id: this.currentCategory.id,
        }).then(() => {
          this.$message.success('分类已成功改为一级分类');
          this.$store.dispatch('getCategories', userId).then(() => {
            // 更新组件的分类数据
            this.filteredCategories = this.categories.filter(
              (category) => category.type === parseInt(this.activeTab)
            );
          });
          this.isMoreDialogVisible = false; // 关闭更多信息弹窗
        }).catch(error => {
          this.$message.error(error.message);
        });
      } catch (error) {
        console.error('改为一级分类失败:', error);
      }
    },
  },
};
</script>

<style scoped>
.category-container {
  padding: 20px;
  background-color: #f9f9f9; /* 背景颜色 */
  border-radius: 8px; /* 圆角 */
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1); /* 阴影 */
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
  position: relative;
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

.sub-category-card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
}

.category-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  text-align: center;
  flex-grow: 1; /* 使名称占据中间位置 */
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
  flex-grow: 1; /* 使名称占据中间位置 */
}

.more-icon-container {
  display: flex;
  align-items: center;
  justify-content: flex-start; /* 左对齐 */
}

.sub-more-icon-container {
  display: flex;
  align-items: center;
  justify-content: flex-end; /* 右对齐 */
}

.expand-icon-container {
  display: flex;
  align-items: center;
  justify-content: flex-end; /* 右对齐 */
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

.add-button-container {
  display: flex;
  justify-content: center;
  position: fixed; /* 固定在页面底部 */
  bottom: 20px; /* 距离底部的距离 */
  left: 50%; /* 水平居中 */
  transform: translateX(-50%); /* 通过平移实现完全居中 */
}

.round-button {
  border-radius: 50%; /* 设置为圆形 */
  width: 60px; /* 按钮宽度 */
  height: 60px; /* 按钮高度 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.el-button {
  position: absolute;
  bottom: 10px;
  right: 10px;
}

.el-menu-vertical-demo {
  width: 100%;
  margin-bottom: 20px;
}

.info-text {
  color: #909399; /* 灰色 */
  font-size: 12px; /* 小字 */
  text-align: left; /* 左对齐 */
  margin: 0; /* 去除默认的段落间距 */
}

.no-category-message {
  text-align: center;
  color: #909399;
  font-size: 16px;
  margin-top: 20px;
}

.no-category-message p {
  margin: 5px 0; /* 添加段落间距 */
}
</style>