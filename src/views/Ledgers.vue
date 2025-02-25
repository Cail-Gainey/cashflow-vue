<template>
  <div class="ledgers-container" @scroll="handleScroll">
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
          <el-button class="more-button" @click.stop="openLedgerDialog(ledger)">...</el-button>
        </div>
      </el-card>
    </div>
    
    <el-dialog :visible.sync="ledgerDialogVisible" width="30%" append-to-body>
      <template slot="title">
        <span>账本详情</span>
      </template>
      <div>
        <el-menu>
          <el-menu-item style="display: flex; justify-content: space-between;" @click="openModifyLedgerDialog(currentLedger)">
            <span>修改</span><span style="margin-left: auto;">></span>
          </el-menu-item>
          <el-menu-item style="display: flex; justify-content: space-between;" @click="openMigrateDialog">
            <span>迁移账本</span><span style="margin-left: auto;">></span>
          </el-menu-item>
          <el-menu-item style="display: flex; justify-content: space-between;" @click="clearLedger">
            <span>清除账本</span><span style="margin-left: auto;">></span>
          </el-menu-item>
          <el-menu-item style="display: flex; justify-content: space-between;" @click="openClearLedgerDialog(currentLedger, true)">
            <span>删除账本</span><span style="margin-left: auto;">></span>
          </el-menu-item>
        </el-menu>
      </div>
    </el-dialog>
    
    <el-dialog :visible.sync="modifyLedgerDialogVisible" width="30%" append-to-body>
      <template slot="title">
        <span>修改账本</span>
      </template>
      <div>
        <input type="file" ref="fileInput" @change="handleImageUpload" style="display: none;" accept="image/*" />
        <img v-if="currentLedger.img" :src="imageUrl" alt="Ledger Image" style="width: 100%; height: auto; margin-bottom: 10px; cursor: pointer;" @click="$refs.fileInput.click()" />
        <el-input v-model="currentLedger.name" placeholder="账本名称" :disabled="!isNameEditable">
          <template v-if="nameExists" #append>
            <span style="color: red;">该账本已存在</span>
          </template>
        </el-input>
        <el-input v-model="currentLedger.remark" placeholder="备注"></el-input>
        <el-button type="primary" @click="saveLedgerChanges">保存</el-button>
        <el-button @click="resetModifyLedgerData">取消</el-button>
      </div>
    </el-dialog>
    
    <el-dialog title="裁剪图片" :visible.sync="cropperVisible" width="600px" :close-on-click-modal="false" append-to-body>
      <div class="cropper-container">
        <vue-cropper
          ref="cropper"
          :img="cropperImage"
          :info="true"
          :autoCrop="true"
          :autoCropWidth="200"
          :autoCropHeight="200"
          :fixedBox="true"
          :fixed="true"
          :fixedNumber="[16, 9]"
          :centerBox="true"
          :high="true"
          :full="true"
          mode="cover"
        ></vue-cropper>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="cropperVisible = false">取消</el-button>
        <el-button type="primary" @click="cropImage">确认</el-button>
      </span>
    </el-dialog>

    <el-dialog :visible.sync="captchaDialogVisible" width="400px" @close="closeCaptchaDialog" class="clear-ledger-dialog">
      <template #title>
        <span :style="{ color: 'red' }">{{ isDeleteAction ? '警告：删除账本将无法恢复！' : '警告：清除账本将删除所有相关数据，无法恢复！' }}</span>
      </template>
      <div class="clear-ledger-content">
        <img :src="captchaImageUrl" alt="验证码" @click="getNewCaptcha" class="captcha-image" />
        <el-input 
          v-model="captchaInput" 
          placeholder="请输入验证码" 
          class="captcha-input" 
          ref="captchaInput" 
        ></el-input>
        <div class="button-container">
          <el-button type="primary" @click="submitCaptcha" :disabled="isSubmitting">{{ isSubmitting ? `${countdown}` : '提交' }}</el-button>
          <el-button @click="closeCaptchaDialog">取消</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 底部居中显示的按钮 -->
    <div class="add-button-container">
      <el-button type="primary" icon="el-icon-plus" @click="showAddLedgerDialog" class="round-button"></el-button>
    </div>

    <!-- 新增账本的弹窗 -->
    <el-dialog title="新增账本" :visible.sync="isAddLedgerDialogVisible" width="400px">
      <el-form :model="newLedger" label-width="100px" label-position="left">
        <el-form-item>
          <div class="upload-container" @click="$refs.newFileInput.click()">
            <input type="file" ref="newFileInput" @change="handleNewImageUpload" style="display: none;" accept="image/*" />
            <div class="upload-box">
              <span class="upload-icon">+</span>
              <img v-if="imageUrl" :src="imageUrl" class="image-preview" />
            </div>
          </div>
        </el-form-item>
        <el-form-item label="账本名称">
          <el-input v-model="newLedger.name" placeholder="请输入账本名称"></el-input>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="newLedger.remark" placeholder="请输入备注"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="closeAddLedgerDialog">取 消</el-button>
        <el-button type="primary" @click="addLedger" style="background-color: #409EFF; color: white;">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 迁移账本的弹窗 -->
    <el-dialog title="迁移账本" :visible.sync="isMigrateDialogVisible" width="400px">
      <div>
        <h3>选择需要迁移的账本</h3>
        <el-select v-model="selectedLedgerToMigrate" placeholder="请选择需要迁移的账本">
          <el-option
            v-for="ledger in ledgers"
            :key="ledger.id"
            :label="ledger.name"
            :value="ledger.id"
          ></el-option>
        </el-select>

        <h3>选择迁移到的账本</h3>
        <el-select v-model="selectedTargetLedger" placeholder="请选择迁移到的账本">
          <el-option
            v-for="ledger in ledgers"
            :key="ledger.id + '-target'"
            :label="ledger.name"
            :value="ledger.id"
            v-if="ledger.id !== selectedLedgerToMigrate"
          ></el-option>
        </el-select>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="closeMigrateDialog">取 消</el-button>
        <el-button type="primary" @click="shiftLedger">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import api from '../api/api';
import { mapGetters } from 'vuex';
import { VueCropper } from 'vue-cropper';

export default {
  components: {
    VueCropper,
  },
  data() {
    return {
      ledgerDialogVisible: false,
      modifyLedgerDialogVisible: false,
      currentLedger: {},
      loading: false,
      page: 1,
      uploadedImage: null,
      cropperImage: null,
      cropperVisible: false,
      imageUrl: null,
      isAddLedgerDialogVisible: false, // 控制新增账本弹窗显示
      newLedger: {
        name: '',
        remark: '',
      },
      isNameEditable: true, // 控制账本名称是否可编辑
      captchaDialogVisible: false, // 控制验证码对话框的显示
      captchaImageUrl: '', // 验证码图片的 URL
      captchaKey: '', // 验证码的 key
      captchaInput: '', // 验证码输入
      isSubmitting: false, // 控制提交按钮是否可用
      countdown: 0, // 倒计时
      isDeleteAction: false, // 新增状态变量，用于区分删除操作
      isMigrateDialogVisible: false, // 控制迁移弹窗显示
      selectedLedgerToMigrate: null, // 选择的迁移账本
      selectedTargetLedger: null, // 选择的目标账本
      nameExists: false, // 新增的状态变量，用于标记名称是否已存在
      originalName: '', // 新增的状态变量，用于保存原始名称
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
      this.$emit('ledger-selected', ledger); // 触发 ledger-selected 事件
    },
    openLedgerDialog(ledger) {
      this.currentLedger = ledger; // 设置当前账本数据
      this.ledgerDialogVisible = true; // 显示详情弹窗
    },
    openModifyLedgerDialog(ledger) {
      this.currentLedger = { ...ledger };
      this.originalName = ledger.name; // 保存原始名称
      this.imageUrl = ledger.img;
      this.modifyLedgerDialogVisible = true;
      this.isNameEditable = ledger.name !== '初始账本';
      this.nameExists = false; // 初始化为 false
    },
    resetModifyLedgerData() {
      this.modifyLedgerDialogVisible = false; // Close the dialog
      this.currentLedger = {}; // 重置当前账本数据
      this.imageUrl = null; // 清空图片 URL
      this.cropperImage = null; // 清空裁剪器图像
    },
    handleScroll(event) {
      const bottom = event.target.scrollHeight === event.target.scrollTop + event.target.clientHeight;
      if (bottom && !this.loading) {
        this.loadMoreLedgers();
      }
    },
    loadMoreLedgers() {
      this.loading = true;
      // Logic to load more ledgers, e.g., fetch from API
      setTimeout(() => {
        this.page++;
        this.loading = false;
        // Simulate loading more ledgers
      }, 1000);
    },
    handleImageUpload(event) {
      const file = event.target.files[0]; // 获取用户选择的文件
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.cropperImage = e.target.result; // 设置裁剪器的图像源
          this.cropperVisible = true; // 显示裁剪器
        };
        reader.readAsDataURL(file);
      }
    },
    cropImage() {
      this.$refs.cropper.getCropData((data) => {
        const arr = data.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        
        // Create a file object
        const file = new File([u8arr], 'avatar.png', { type: mime });
        
        // Create a Blob URL for preview
        this.imageUrl = URL.createObjectURL(file); // 仅在裁剪后设置预览 URL
        this.newLedger.img = file; // 保存裁剪后的文件对象到新账本对象

        this.cropperVisible = false; // Close the cropper dialog
      });
    },
    async saveLedgerChanges() {
      let imageUrl = this.currentLedger.img; // 使用当前图像

      // 检查图片是否被更改
      if (this.imageUrl && this.imageUrl !== this.currentLedger.img) {
        const formData = new FormData();
        const file = this.newLedger.img; // 使用裁剪后的文件对象

        if (!file) {
          console.error('No file selected for upload');
          this.$message.error('请先选择图片');
          return;
        }

        formData.append('file', file); // 使用裁剪后的文件

        try {
          const response = await api.uploadLedgerImg(formData);
          imageUrl = response;
        } catch (error) {
          console.error('图片上传失败', error);
          this.$message.error(error.message || '图片上传失败');
          return; // Exit if the image upload fails
        }
      }

      const userId = localStorage.getItem('userId');
      // Now update the ledger details
      try {
        const updatedLedger = { ...this.currentLedger };
        if (this.imageUrl && this.imageUrl !== this.currentLedger.img) {
          updatedLedger.img = imageUrl; // 只有在图片被更改时才更新img字段
        } else {
          delete updatedLedger.img; // 如果没有新图片上传，删除img字段
        }
        await this.$store.dispatch('updateLedgerAndRefresh', { userId, updatedLedger });
        this.$message.success('更新成功');
      } catch (error) {
        console.error('Failed to update ledger:', error);
        this.$message.error('更新失败');
      } finally {
        this.closeAllDialogs(); // 无论成功与否，关闭所有相关弹窗
      }
    },
    showAddLedgerDialog() {
      this.isAddLedgerDialogVisible = true; // 显示新增账本弹窗
    },
    closeAddLedgerDialog() {
      this.isAddLedgerDialogVisible = false; // 关闭弹窗
      this.resetNewLedger(); // 重置表单
    },
    resetNewLedger() {
      this.newLedger = { name: '', remark: '' }; // 重置新增账本数据
      this.imageUrl = null; // 清空图片 URL
    },
    handleNewImageUpload(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.cropperImage = e.target.result; // 设置裁剪器的图像源
          this.cropperVisible = true; // 显示裁剪器
        };
        reader.readAsDataURL(file);
      }
    },
    async addLedger() {
      if (!this.newLedger.name) {
        this.$message.error('账本名称不能为空');
        return;
      }

      // 上传裁剪后的图片
      let imageUrl = null;
      if (this.imageUrl) {
        const formData = new FormData();
        const file = this.newLedger.img; // 使用裁剪后的文件对象

        if (!file) {
          console.error('No file selected for upload');
          this.$message.error('请先选择图片');
          return;
        }

        formData.append('file', file); // 使用裁剪后的文件

        try {
          const response = await api.uploadLedgerImg(formData);
          imageUrl = response;
        } catch (error) {
          console.error('Image upload failed:', error);
          this.$message.error('图片上传失败');
          return;
        }
      }

      // 发送新增账本请求
      const userId = localStorage.getItem('userId');
      const newLedgerData = {
        ...this.newLedger,
        img: imageUrl, // 将返回的图片URL作为img字段
      };

      try {
        await api.createLedger(userId, newLedgerData); // 调用API创建新的账本
        this.$message.success('添加成功');
        await this.$store.dispatch('getLedgers'); // 确保刷新账本列表
        this.closeAddLedgerDialog(); // 关闭弹窗
        this.resetNewLedger(); // 重置表单
      } catch (error) {
        console.error('Failed to add ledger:', error);
        this.$message.error(error.message || '添加失败，请稍后再试');
      }
    },
    async clearLedger() {
      try {
        const captchaResponse = await api.getCaptcha();
        this.captchaKey = captchaResponse.captchaKey;
        this.captchaImageUrl = captchaResponse.imageUrl;
        this.captchaDialogVisible = true; // 显示验证码对话框
        this.startCountdown(); // 在弹窗打开时启动倒计时
      } catch (error) {
        console.error('获取验证码失败:', error);
        this.$message.error('获取验证码失败');
      }
    },
    async getNewCaptcha() {
      try {
        const captchaResponse = await api.getCaptcha();
        this.captchaKey = captchaResponse.captchaKey;
        this.captchaImageUrl = captchaResponse.imageUrl; // 更新验证码图片 URL
        
        // 在验证码获取成功后聚焦输入框
        this.$nextTick(() => {
          this.$refs.captchaInput.focus(); // 自动聚焦输入框
        });
      } catch (error) {
        console.error('获取验证码失败:', error);
        this.$message.error('获取验证码失败');
      }
    },
    async submitCaptcha() {
      if (!this.captchaInput) {
        this.$message.error('验证码不能为空');
        return;
      }
      if (this.captchaInput.length !== 4) {
        this.$message.error('验证码长度必须为4位');
        return;
      }

      this.isSubmitting = true;
      const formData = new FormData();
      formData.append('inputCode', this.captchaInput);
      formData.append('captchaKey', this.captchaKey);

      const userId = localStorage.getItem('userId');
      const ledgerId = this.currentLedger.id;

      try {
        if (this.isDeleteAction) {
          await api.removeLedger(userId, ledgerId, formData);
          this.$message.success('删除账本成功');
        } else {
          await api.clean(userId, ledgerId, formData);
          this.$message.success('清除账本成功');
        }
        await this.$store.dispatch('getLedgers'); // 刷新账本列表
      } catch (error) {
        this.$message.error(this.isDeleteAction ? '删除账本失败' : '清除账本失败');
        this.getNewCaptcha();
      } finally {
        this.closeAllDialogs(); // 无论成功与否，关闭所有相关弹窗
        this.isSubmitting = false;
      }
    },
    closeAllDialogs() {
      this.ledgerDialogVisible = false;
      this.modifyLedgerDialogVisible = false;
      this.captchaDialogVisible = false;
    },
    startCountdown() {
      this.countdown = 10; // 初始化倒计时
      this.isSubmitting = true; // 启用倒计时时禁用按钮
      const interval = setInterval(() => {
        this.countdown--;
        if (this.countdown <= 0) {
          clearInterval(interval);
          this.isSubmitting = false; // 倒计时结束，启用按钮
        }
      }, 1000);
    },
    closeCaptchaDialog() {
      this.captchaDialogVisible = false; // 关闭对话框
      this.captchaInput = ''; // 关闭时清空输入
    },
    openClearLedgerDialog(ledger, isDelete = false) {
      this.currentLedger = ledger; // 设置当前账本数据
      this.isDeleteAction = isDelete; // 设置操作类型
      this.getNewCaptcha(); // 获取新的验证码
      this.captchaDialogVisible = true; // 显示验证码对话框
      this.startCountdown(); // 启动倒计时

      // 在弹窗打开时聚焦输入框
      this.$nextTick(() => {
        this.$refs.captchaInput.focus(); // 自动聚焦输入框
      });
    },
    openMigrateDialog() {
      this.isMigrateDialogVisible = true; // 显示迁移弹窗
    },
    closeMigrateDialog() {
      this.isMigrateDialogVisible = false; // 关闭迁移弹窗
      this.selectedLedgerToMigrate = null; // 重置选择的迁移账本
      this.selectedTargetLedger = null; // 重置选择的目标账本
    },
    async shiftLedger() {
      // 确保选择了需要迁移的账本和目标账本
      if (this.selectedLedgerToMigrate && this.selectedTargetLedger) {
        const userId = localStorage.getItem('userId'); // 获取用户 ID
        const oldId = this.selectedLedgerToMigrate; // 需要迁移的账本 ID
        const newId = this.selectedTargetLedger; // 迁移到的账本 ID

        try {
          // 调用 API 进行迁移操作
          await api.shiftLedger(userId, oldId, newId);
          this.$message.success('账本迁移成功');
          this.closeMigrateDialog(); // 关闭弹窗
        } catch (error) {
          console.error('账本迁移失败:', error);
          this.$message.error('账本迁移失败，请稍后再试');
        }
      } else {
        this.$message.error('请确保选择了需要迁移的账本和目标账本');
      }
    },
  },
  beforeDestroy() {
    if (this.imageUrl) {
      URL.revokeObjectURL(this.imageUrl); // 清理URL
    }
  }
};
</script>

<style scoped>
.ledgers-container {
  overflow-y: auto;
}

.ledger-item {
  margin-bottom: 10px;
}

.loading-indicator {
  text-align: center;
  padding: 10px;
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

/* 覆盖element-ui的默认样式 */
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

.more-button {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 5px;
  font-size: 16px;
}

.cropper-container {
  width: 100%;
  height: 400px;
  background: #f0f0f0;
  display: flex;
  justify-content: center;
  align-items: center;
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

.upload-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.upload-box {
  width: 100%; /* 设置方框的宽度 */
  height: 90px; /* 设置方框的高度，保持16:9比例 */
  border: 2px dashed #409EFF; /* 边框样式 */
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px; /* 方框与图片之间的间距 */
  background-color: #f9f9f9; /* 背景颜色 */
  position: relative; /* 使得子元素绝对定位 */
}

.upload-icon {
  font-size: 36px; /* 图标大小 */
  color: #409EFF; /* 图标颜色 */
  position: absolute; /* 绝对定位 */
}

.image-preview {
  width: 100%; /* 设置预览图片的宽度 */
  height: 100%; /* 设置预览图片的高度 */
  object-fit: cover; /* 保持图片比例 */
  border-radius: 4px; /* 圆角 */
}
  
.clear-ledger-dialog {
  text-align: center; /* 中心对齐 */
}

.clear-ledger-content {
  padding: 20px; /* 内边距 */
}

.warning-message {
  color: red; /* 警告信息颜色 */
  font-weight: bold; /* 加粗 */
  margin-bottom: 15px; /* 下边距 */
}

.captcha-image {
  cursor: pointer; /* 鼠标指针样式 */
  margin-bottom: 15px; /* 下边距 */
  border: 1px solid #ccc; /* 边框 */
  border-radius: 4px; /* 圆角 */
  width: 100%; /* 宽度100% */
  max-width: 300px; /* 最大宽度 */
}

.captcha-input {
  margin-bottom: 15px; /* 下边距 */
}

.button-container {
  display: flex; /* 使用flex布局 */
  justify-content: space-between; /* 按钮之间的间距 */
}
</style>
