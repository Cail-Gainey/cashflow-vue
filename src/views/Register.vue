<template>
  <div class="auth-container">
    <div class="form-container">
      <div class="avatar-upload">
        <el-upload
          class="avatar-uploader"
          action="#"
          :show-file-list="false"
          :before-upload="beforeAvatarUpload"
          :http-request="handleAvatarUpload"
        >
          <img v-if="imageUrl" :src="imageUrl" class="avatar-image">
          <div v-else class="avatar-placeholder">
            <i class="el-icon-plus avatar-icon"></i>
            <div class="upload-text">上传头像</div>
          </div>
        </el-upload>
      </div>
      
      <el-form :model="form" :rules="rules" ref="form" class="form-content" @keyup.enter.native.prevent="submitForm">
        <el-form-item prop="email" class="form-item">
          <span class="form-label">邮箱<span class="required">*</span></span>
          <el-input v-model="form.email" placeholder="请输入邮箱" class="input-field" />
        </el-form-item>

        <el-form-item prop="verificationCode" class="form-item code-item">
          <span class="form-label">验证码<span class="required">*</span></span>
          <div class="code-input-wrapper">
            <el-input v-model="form.verificationCode" placeholder="请输入验证码" class="input-field code-input" />
            <el-button 
              @click="showCaptchaDialog" 
              :loading="loading" 
              type="primary" 
              class="send-code-btn"
              :disabled="isCaptchaVerified || countdown > 0"
            >
              {{ countdown > 0 ? `${countdown}秒后重发` : '发送验证码' }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item prop="password" class="form-item">
          <span class="form-label">密码<span class="required">*</span></span>
          <el-input type="password" v-model="form.password" placeholder="请输入密码" class="input-field" />
        </el-form-item>

        <el-form-item prop="confirmPassword" class="form-item">
          <span class="form-label">确认密码<span class="required">*</span></span>
          <el-input type="password" v-model="form.confirmPassword" placeholder="请确认密码" class="input-field" />
        </el-form-item>

        <el-form-item prop="username" class="form-item">
          <span class="form-label">昵称<span class="required">*</span></span>
          <el-input v-model="form.username" placeholder="请输入昵称" class="input-field" />
        </el-form-item>

        <el-form-item prop="sex" class="form-item">
          <span class="form-label">性别</span>
          <el-select v-model="form.sex" placeholder="请选择性别" class="select-field">
            <el-option label="男" :value="1"></el-option>
            <el-option label="女" :value="2"></el-option>
            <el-option label="不愿透露" :value="0"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item class="button-group">
          <el-button 
            @click="goToLogin" 
            type="primary" 
            class="back-to-login-btn"
          >
            返回登录
          </el-button>
          <el-button 
            @click="submitForm" 
            type="primary" 
            class="submit-btn"
            @keydown.enter.native.prevent="submitForm"
          >
            注册
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 验证码对话框 -->
    <el-dialog 
      :visible.sync="dialogVisible" 
      title="验证码验证" 
      width="20%" 
      center 
      class="captcha-dialog"
      @keyup.enter.native="verifyCaptcha"
    >
      <div class="captcha-content">
        <el-input 
          v-model="userInputCaptcha" 
          placeholder="请输入验证码" 
          class="captcha-input" 
          ref="captchaInput"
          @keyup.enter.native="verifyCaptcha"
        />
        <div class="captcha-image-wrapper">
          <img v-if="captchaImage" :src="captchaImage" alt="验证码" class="captcha-image" @click="reloadCaptcha" />
          <div v-else class="captcha-loading">
            <i class="el-icon-loading"></i>
          </div>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="verifyCaptcha" :loading="verifying">验证</el-button>
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
  </div>
</template>

<script>
import api from '@/api/api';
import router from '@/router';
import { VueCropper } from 'vue-cropper';

export default {
  components: {
    VueCropper
  },
  data() {
    return {
      form: {
        email: '',
        verificationCode: '',
        password: '',
        confirmPassword: '',
        username: '',
        sex: 0,
        avatar: null
      },
      userInputCaptcha: '',
      captchaImage: null,
      captchaKey: '',
      dialogVisible: false,
      isCaptchaVerified: false,
      loading: false,
      countdown: 0,
      timer: null,
      verifying: false,
      rules: {
        email: [
          { required: true, message: '请输入邮箱地址', trigger: 'blur' },
          { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
        ],
        verificationCode: [
          { required: true, message: '请输入验证码', trigger: 'blur' },
          { len: 6, message: '验证码必须是6位', trigger: 'blur' }
        ],
        password: [
          { 
            required: true, 
            message: '请输入密码', 
            trigger: 'blur' 
          },
          { 
            pattern: /^(?!.*(.)\1{2})[a-zA-Z]\w{5,15}$/, 
            message: '密码必须包含字母和数字，字母开头，不允许连续三个相同字符', 
            trigger: 'blur'
          }
        ],
        confirmPassword: [
          { required: true, message: '请确认密码', trigger: 'blur' },
          { validator: this.checkConfirmPassword, trigger: 'blur' }
        ],
        username: [
          { required: true, message: '昵称为必填项', trigger: 'blur' }
        ],
      },
      imageUrl: '',
      cropperVisible: false,
      cropperImage: ''
    };
  },
  watch: {
    dialogVisible(newVal) {
      if (!newVal) {
        // 当对话框关闭时，清空输入的验证码
        this.userInputCaptcha = '';
      }
    }
  },
  methods: {
    checkConfirmPassword(rule, value, callback) {
      if (value !== this.form.password) {
        callback(new Error('两次密码输入不一致'));
      } else {
        callback();
      }
    },

    async showCaptchaDialog() {
      const email = this.form.email;
      if (!email) {
        this.showErrorMessage('请输入邮箱地址');
        return;
      }

      // 显示loading状态
      this.loading = true;
      
      try {
        // 获取验证码图片
        const response = await api.getCaptcha();
        if (response) {
          // 保存验证码key和图片URL
          this.captchaKey = response.captchaKey;
          this.captchaImage = response.imageUrl;
          // 获取成功后再显示弹窗
          this.dialogVisible = true;
          // 自动聚焦验证码输入框
          this.$nextTick(() => {
            this.$refs.captchaInput.focus();
          });
        } else {
          this.showErrorMessage('获取验证码失败');
        }
      } catch (error) {
        console.error('获取验证码错误:', error);
        this.showErrorMessage('获取验证码失败');
      } finally {
        this.loading = false;
      }
    },

    async reloadCaptcha() {
      this.captchaImage = null; // 清空验证码图片显示loading
      try {
        const response = await api.getCaptcha();
        if (response) {
          this.captchaKey = response.captchaKey;
          this.captchaImage = response.imageUrl;
          this.userInputCaptcha = ''; // 清空输入框
        } else {
          this.showErrorMessage('刷新验证码失败');
        }
      } catch (error) {
        console.error('刷新验证码错误:', error);
        this.showErrorMessage('刷新验证码失败');
      }
    },

    async verifyCaptcha() {
      if (!this.userInputCaptcha) {
        this.showErrorMessage('请输入验证码');
        return;
      }
      
      // Prevent multiple submissions
      if (this.verifying) {
        return; // Exit if already verifying
      }
      
      this.verifying = true; // Set verifying to true
      try {
        const response = await api.verifyCode(this.captchaKey, this.userInputCaptcha);
        if (response) {
          this.$message.success('验证码验证成功');
          this.isCaptchaVerified = true;
          this.dialogVisible = false;
      
          this.loading = false;
          this.countdown = 60;
          this.startCountdown();
      
          // Call sendEmailCode after successful verification
          this.sendEmailCode();
        } else {
          this.showErrorMessage('验证码错误');
          this.reloadCaptcha();
        }
      } catch (error) {
        this.showErrorMessage(error.message || '验证码验证失败');
        this.reloadCaptcha();
      } finally {
        this.verifying = false; // Reset verifying status
      }
    },

    async sendEmailCode() {
      if (!this.isCaptchaVerified) {
        this.showErrorMessage('请先验证图片验证码');
        return;
      }

      const email = this.form.email;
      if (!email) {
        this.showErrorMessage('请输入邮箱地址');
        return;
      }

      // Prevent sending multiple requests
      if (this.loading) {
        return; // Exit if already loading
      }

      this.loading = true;

      try {
        const response = await api.sendEmailCode(email);
        if (response) {
          this.$message.success('验证码发送成功');
          // Start countdown only after successful email code sending
          this.countdown = 60;
          this.startCountdown();
        } else {
          this.showErrorMessage('验证码发送失败');
        }
      } catch {
        this.showErrorMessage('验证码发送失败');
      } finally {
        this.loading = false;
      }
    },

    startCountdown() {
      // 清除任何现有的计时器
      if (this.timer) {
        clearInterval(this.timer);
      }

      this.timer = setInterval(() => {
        this.countdown--;
        if (this.countdown <= 0) {
          clearInterval(this.timer);
          this.isCaptchaVerified = false;
        }
      }, 1000);
    },

    showErrorMessage(message) {
      this.$message.error(message);
    },

    submitForm() {
      this.$refs.form.validate(async (valid) => {
        if (valid) {
          try {
            // 如果有头像，先上传头像
            if (this.form.avatar) {
              const formData = new FormData();
              formData.append('file', this.form.avatar);
              
              const avatarResponse = await api.uploadAvatar(formData);
              if (avatarResponse) {
                // 保存头像路径
                this.form.avatar = avatarResponse;
              } else {
                this.$message.error('头像上传失败');
                return;
              }
            }

            // 准备注册数据
            const registerData = {
              email: this.form.email,
              password: this.form.password,
              username: this.form.username,
              sex: this.form.sex,
              avatar: this.form.avatar
            };

            // 发送注册请求
            const response = await api.register(registerData);
            
            if (response) {
              this.$message.success('注册成功');
              this.$router.push('/login');
            }
          } catch (error) {
            this.showErrorMessage(error.message || '注册失败');
          }
        } else {
          this.showErrorMessage('请填写完整信息');
        }
      });
    },

    goToLogin() {
      router.push('/login')
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
        
        this.cropperVisible = false;
      });
    },

    handleAvatarUpload(options) {
      const file = options.file;
      this.form.avatar = file;
      
      // 创建本地预览
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imageUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }
};
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  max-height: 100vh;
  background-image: url('@/assets/bg2.png');
  background-size: cover;
  background-position: center;
  overflow-y: auto;
}

.form-container {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.3);
  padding: 30px;
  width: 100%;
  max-width: 500px;
  height: auto; /* 设置为自动高度 */
  overflow-y: visible; /* 移除滚动条 */
  transition: all 0.3s ease; /* 保留过渡效果 */
}

.form-content {
  width: 100%;
}

.form-item {
  margin-bottom: 10px;
}

.form-label {
  display: block;
  margin-bottom: 3px;
  font-size: 13px;
  color: #777;
}

.required {
  color: #F56C6C;
  margin-left: 2px;
}

.input-field {
  width: 100%;
}

.input-field .el-input__inner {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 10px;
  font-size: 14px;
  transition: border-color 0.3s ease; /* Added transition */
}

.input-field .el-input__inner:focus {
  border-color: #1976d2;
  box-shadow: 0 0 5px rgba(25, 118, 210, 0.5);
}

.code-item {
  display: flex;
  flex-direction: column; 
}

.code-input-wrapper {
  display: flex;
  align-items: center;
}

.code-input {
  flex-grow: 1;
  margin-right: 10px;
}

.send-code-btn {
  border-color: #1976d2;
  padding: 12px;
  font-size: 14px;
}

.select-field {
  width: 100%;
}

.captcha-dialog {
  border-radius: 16px;
}

.captcha-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.captcha-input {
  width: 100%;
  margin-bottom: 5px;
}

.captcha-image-wrapper {
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 10px 0;
}

.captcha-image {
  max-width: 100%;
  border: 2px solid #1976d2;
  border-radius: 8px;
}

.button-group {
  display: flex;
  justify-content: space-between;
}

.back-to-login-btn {
  width: 51%;
  padding: 12px;
  background-color: #409eff; /* 按钮背景色 */
  color: white; /* 按钮文字颜色 */
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.back-to-login-btn:hover {
  background-color: #66b1ff; /* 悬停时的背景色 */
  transform: translateY(-2px); /* 悬停时的位移效果 */
}

.submit-btn {
  width: 40%;
  padding: 12px;
  background-color: #409eff; /* 按钮背景色 */
  color: white; /* 按钮文字颜色 */
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.submit-btn:hover {
  background-color: #66b1ff; /* 悬停时的背景色 */
  transform: translateY(-2px); /* 悬停时的位移效果 */
}

.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
  position: relative;
}

.cropper-container {
  width: 100%;
  height: 400px;
  background-color: #f5f7fa;
  border-radius: 4px;
  overflow: hidden;
}

:deep(.cropper-view-box) {
  border-radius: 50%;
  outline: 2px solid #fff;
  outline-offset: -1px;
}

:deep(.cropper-face) {
  border-radius: 50%;
}

:deep(.cropper-wrap-box) {
  border-radius: 50%;
}

.cropper-btns {
  margin-top: 16px;
  display: flex;
  justify-content: center;
  gap: 16px;
}

:deep(.cropper) {
  background-color: #f5f7fa;
}

.avatar-uploader {
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
}

.avatar-uploader :deep(.el-upload) {
  width: 120px;
  height: 120px;
  border-radius: 50%;
}

.avatar-image {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 120px;
  height: 120px;
  border: 2px dashed #d9d9d9;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #fafafa;
  position: relative;
}

.avatar-icon {
  font-size: 28px;
  color: #8c939d;
  margin-bottom: 8px;
  line-height: 1;
  position: absolute;
  top: 35px;
  left: 50%;
  transform: translateX(-50%);
}

.upload-text {
  font-size: 12px;
  color: #8c939d;
  position: absolute;
  bottom: 35px;
  width: 100%;
  text-align: center;
}

:deep(.el-upload) {
  display: block;
}

.captcha-loading {
  width: 100%;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.captcha-loading i {
  font-size: 24px;
  color: #409EFF;
}
</style>
