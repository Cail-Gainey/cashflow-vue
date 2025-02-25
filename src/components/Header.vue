<template>
  <el-header>
    <div class="header-content">
      <el-dropdown>
        <div class="user-info">
          <span class="user-name">{{ localUserInfo?.username }}</span>
          <el-avatar :src="imageUrl || localUserInfo?.avatar" class="user-avatar" v-if="localUserInfo && localUserInfo.avatar"></el-avatar>
        </div>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item @click.native="handleLogout">退出</el-dropdown-item>
          <el-dropdown-item @click.native="showUserInfo">个人信息</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
    <el-dialog :visible.sync="userInfoDialogVisible" title="用户信息" width="30%">
      <div style="text-align: center;">
        <el-upload
          class="avatar-uploader"
          action="#"
          :show-file-list="false"
          :before-upload="beforeAvatarUpload"
          :disabled="!isEditing"
        >
          <img :src="imageUrl || localUserInfo.avatar" class="avatar" style="width: 100px; height: 100px; border-radius: 50%; cursor: pointer;" />
        </el-upload>
      </div>
      <el-descriptions border>
        <el-descriptions-item label="用户名">
          <el-input v-model="localUserInfo.username" :disabled="!isEditing"></el-input>
          <span v-if="usernameError" class="error-message">{{ usernameError }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="邮箱">
          <el-input v-model="localUserInfo.email" :disabled="true"></el-input>
        </el-descriptions-item>
        <el-descriptions-item label="性别">
          <el-select v-model="localUserInfo.sex" :disabled="!isEditing">
            <el-option label="不愿透露" :value="0"></el-option>
            <el-option label="男" :value="1"></el-option>
            <el-option label="女" :value="2"></el-option>
          </el-select>
        </el-descriptions-item>
        <el-descriptions-item label="电话">
          <el-input v-model="localUserInfo.phone" :disabled="!isEditing"></el-input>
          <span v-if="phoneError" class="error-message">{{ phoneError }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="注册时间" :span="3">
          <el-input v-model="localUserInfo.createdTime" :disabled="true"></el-input>
        </el-descriptions-item>
        <el-descriptions-item label="密码">
          <el-input
            v-model="localUserInfo.password"
            :disabled="!isEditing"
            type="password"
            placeholder="请输入新密码"
          ></el-input>
          <span v-if="passwordError" class="error-message">{{ passwordError }}</span>
        </el-descriptions-item>
      </el-descriptions>
      <span slot="footer" class="dialog-footer">
        <el-button v-if="!isEditing" type="primary" @click="isEditing = true">编辑</el-button>
        <el-button v-if="isEditing" type="primary" @click="saveUserInfo">保存</el-button>
        <el-button @click="closeUserInfoDialog">取消</el-button>
      </span>
    </el-dialog>

    <!-- 图片裁剪对话框 -->
    <el-dialog 
      title="裁剪头像" 
      :visible.sync="cropperVisible"
      width="600px"
      :close-on-click-modal="false"
      append-to-body
    >
      <div class="cropper-container" style="width: 100%; height: 400px;">
        <vue-cropper
          ref="cropper"
          :img="cropperImage"
          :info="true"
          :autoCrop="true"
          :autoCropWidth="200"
          :autoCropHeight="200"
          :fixedBox="true"
          :fixed="true"
          :fixedNumber="[1, 1]"
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
  </el-header>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { Loading } from 'element-ui';
import api from '../api/api';
import { VueCropper } from 'vue-cropper';

export default {
  components: {
    VueCropper
  },
  data() {
    return {
      userInfoDialogVisible: false,
      isEditing: false,
      imageUrl: '',
      cropperVisible: false,
      cropperImage: '',
      form: {
        avatar: null
      },
      usernameError: '',
      passwordError: '',
      phoneError: '',
      localUserInfo: {}
    };
  },
  computed: {
    ...mapGetters(['getUserInfo']),
  },
  created() {
    this.localUserInfo = { ...this.getUserInfo };
  },
  watch: {
    'localUserInfo.username'(newVal) {
      if (newVal.length > 10) {
        this.usernameError = '最多10个字符';
      } else {
        this.usernameError = '';
      }
    },
    'localUserInfo.password'(newVal) {
      if (newVal && !this.validatePassword(newVal)) {
        this.passwordError = '密码必须包含字母和数字，字母开头，不允许连续三个相同字符，最多10个字符';
      } else {
        this.passwordError = '';
      }
    },
    'localUserInfo.phone'(newVal) {
      if (newVal && !/^1[3-9]\d{9}$/.test(newVal)) {
        this.phoneError = '请输入有效的号码';
      } else {
        this.phoneError = '';
      }
    }
  },
  methods: {
    ...mapActions(['logout', 'updateUserInfo']),
    async handleLogout() {
      const loadingInstance = Loading.service({
        text: '正在退出...',
        spinner: 'el-icon-loading',
        background: 'rgba(255, 255, 255, 0.7)',
      });
      try {
        await this.logout();
        this.$router.push('/login');
        this.$message.success('退出成功');
      } catch (error) {
        console.error('Logout error:', error);
        this.$message.error(`退出失败: ${error.message || '未知错误'}`);
      } finally {
        loadingInstance.close();
      }
    },
    showUserInfo() {
      this.userInfoDialogVisible = true;
    },
    closeUserInfoDialog() {
      this.userInfoDialogVisible = false;
      this.isEditing = false;
      this.resetUserInfo();
    },
    resetUserInfo() {
      this.localUserInfo = { ...this.getUserInfo };
      this.usernameError = '';
      this.passwordError = '';
      this.phoneError = '';
    },
    beforeAvatarUpload(file) {
      const isImage = file.type.startsWith('image/');
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isImage) {
        this.$message.error('上传头像图片只能是图片格式!');
        return false;
      }
      if (!isLt2M) {
        this.$message.error('上传头像图片大小不能超过 2MB!');
        return false;
      }

      // 读取文件用于裁剪
      const reader = new FileReader();
      reader.onload = (e) => {
        this.cropperImage = e.target.result;
        this.cropperVisible = true;
      };
      reader.readAsDataURL(file);
      
      return false; // 阻止自动上传
    },
    cropImage() {
      this.$refs.cropper.getCropData((data) => {
        this.imageUrl = data;
        this.cropperVisible = false;
        
        // 将base64转换为文件对象
        const arr = data.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        this.form.avatar = new File([u8arr], 'avatar.png', { type: mime });
      });
    },
    async saveUserInfo() {
      try {
        if (this.isEditing) {
          // 仅在密码不为空时进行验证
          if (this.localUserInfo.password && !this.validatePassword(this.localUserInfo.password)) {
            this.$message.error('密码必须包含字母和数字，字母开头，不允许连续三个相同字符，最多10个字符');
            return;
          }
          // 仅在电话不为空时进行验证
          if (this.localUserInfo.phone && !/^1[3-9]\d{9}$/.test(this.localUserInfo.phone)) {
            this.$message.error('请输入有效的中国大陆手机号码');
            return;
          }
        }
        // 如果有头像，先上传头像
        if (this.form.avatar) {
          const formData = new FormData();
          formData.append('file', this.form.avatar);
          
          const avatarResponse = await api.uploadAvatar(formData);
          if (avatarResponse) {
            // 保存头像路径
            this.localUserInfo.avatar = avatarResponse;
          } else {
            this.$message.error(avatarResponse.message || '头像上传失败');
            return;
          }
        }

        // 更新用户信息时传递 userId 和 formData
        const response = await api.updateUser(this.localUserInfo.id, { ...this.localUserInfo });
        if (response) {
          this.$message.success('用户信息更新成功');
          this.isEditing = false;
          // Update Vuex store with new user info
          await this.$store.dispatch('updateUserInfo', this.localUserInfo);
        } else {
          this.$message.error('更新用户信息失败');
        }
      } catch (error) {
        console.error('Failed to update user info:', error);
        this.$message.error(`更新用户信息失败: ${error.message || '未知错误'}`);
      }
    },
    validatePassword(password) {
      const regex = /^(?!.*(.)\1{2})[a-zA-Z](?=.*\d)[a-zA-Z\d]{1,9}$/;
      return regex.test(password);
    },
    getSexLabel(sex) {
      switch (sex) {
        case 0:
          return '不愿透露';
        case 1:
          return '男';
        case 2:
          return '女';
        default:
          return '未知';
      }
    }
  }
}
</script>

<style scoped>
.el-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #B3C0D1;
  color: #333;
  height: 60px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
}

.user-info {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.user-name {
  margin-right: 10px;
  font-size: 16px;
}

.user-avatar {
  cursor: pointer;
}

.logout-button {
  margin-left: 10px;
}

.avatar-uploader {
  display: flex;
  justify-content: center;
  align-items: center;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin-bottom: 10px;
}

.error-message {
  color: red;
  font-size: 12px;
  margin-top: 5px;
}
</style>