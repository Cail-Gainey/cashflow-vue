<template>
  <div class="auth-container">
    <div class="form-container">
      <h2 class="form-title">忘记密码</h2>
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
            确认
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-dialog :visible.sync="dialogVisible" title="验证码验证" width="20%" center class="captcha-dialog" @keydown.enter.native.prevent="verifyCaptcha">
      <div class="captcha-content">
        <el-input 
          v-model="userInputCaptcha" 
          placeholder="请输入验证码" 
          class="captcha-input" 
          ref="captchaInput"
          @keydown.enter.native="handleKeyPress"
        />
        <div class="captcha-image-wrapper">
          <img v-if="captchaImage" :src="captchaImage" alt="验证码" class="captcha-image" @click="reloadCaptcha" />
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="verifyCaptcha">验证</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import api from '@/api/api';
import router from '@/router';

export default {
  data() {
    return {
      form: {
        email: '',
        verificationCode: '',
        password: '',
        confirmPassword: '',
      },
      userInputCaptcha: '',
      captchaImage: null,
      captchaKey: '',
      dialogVisible: false,
      isCaptchaVerified: false,
      loading: false,
      countdown: 0,
      timer: null,
      audioCaptcha: null,
      ageOptions: Array.from({ length: 100 }, (_, i) => i + 1),
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
      }
    };
  },
  methods: {
    checkConfirmPassword(rule, value, callback) {
      if (value !== this.form.password) {
        callback(new Error('两次密码输入不一致'));
      } else {
        callback();
      }
    },

    async sendVerificationCode() {
      if (!this.isCaptchaVerified) {
        this.showErrorMessage('请先验证图片验证码');
        return;
      }

      const email = this.form.email;
      if (!email) {
        this.showErrorMessage('请输入邮箱地址');
        return;
      }

      this.loading = true;
      this.countdown = 60;
      this.isCaptchaVerified = true;
      this.startCountdown();

      try {
        const response = await api.forgetPwd(email);
        if (response) {
          this.$message.success('验证码发送成功');
        }
      } catch {
        this.showErrorMessage('验证码发送失败');
      } finally {
        this.loading = false;
      }
    },

    startCountdown() {
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

    showCaptchaDialog() {
      const email = this.form.email;
      if (!email) {
        this.showErrorMessage('请输入邮箱地址');
        return;
      }
      this.dialogVisible = true;
      this.reloadCaptcha();
      this.$nextTick(() => {
        this.$refs.captchaInput.focus();
      });
    },

    async reloadCaptcha() {
      this.loading = true;
      this.userInputCaptcha = '';
      try {
        const response = await api.getCaptcha();
        this.captchaImage = response.imageUrl;
        this.captchaKey = response.captchaKey;
      } catch {
        this.showErrorMessage('验证码加载失败');
      } finally {
        this.loading = false;
      }
    },

    async verifyCaptcha() {
      if (!this.userInputCaptcha) {
        this.showErrorMessage('请输入验证码');
        return;
      }

      this.loading = true;
      try {
        const response = await api.verifyCode(this.captchaKey, this.userInputCaptcha);

        if (response) {
          this.$message.success('验证码验证成功');
          this.isCaptchaVerified = true;
          this.dialogVisible = false;
          this.sendVerificationCode();
        } else {
          this.showErrorMessage('验证码错误');
          this.reloadCaptcha();
        }
      } catch {
        this.showErrorMessage('验证码验证失败');
        this.reloadCaptcha();
      } finally {
        this.loading = false;
      }
    },

    handleKeyPress(event) {
      if (event.key === 'Enter') {
        this.verifyCaptcha();
      }
    },

    submitForm() {
      this.$refs.form.validate(async (valid) => {
        if (valid) {
          try {
            const response = await api.updatePwd(this.form);
        
            // 直接根据响应判断是否成功
            if (response) {
              this.$message.success('修改成功');
              this.$router.push('/login');
            }
          } catch (error) {
            // 这里捕获到的错误是 Promise.reject 的错误
            this.showErrorMessage(error.message || '修改失败');
          }
        } else {
          this.showErrorMessage('请填写完整信息');
        }
      });
    },

    goToLogin() {
      router.push('/login')
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
  transition: background 0.5s ease;
}

.form-container {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.3);
  padding: 30px;
  width: 100%;
  max-width: 500px;
  height: fit-content;
  overflow-y: auto;
  transition: transform 0.3s ease;
}

.form-title {
  text-align: center;
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
  transition: color 0.3s ease;
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

.input-field {
  width: 100%;
}

.input-field .el-input__inner {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 10px;
  transition: all 0.3s ease;
  font-size: 14px;
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
  background-color: #409eff; 
  color: white; 
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.send-code-btn:hover {
  background-color: #66b1ff; 
  transform: translateY(-2px); 
}

.select-field {
  width: 100%;
}

.captcha-dialog {
  border-radius: 16px;
  transition: all 0.3s ease;
}

.captcha-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: fadeIn 0.5s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
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
  transition: transform 0.3s ease;
}

.captcha-image {
  max-width: 100%;
  border: 2px solid #1976d2;
  border-radius: 8px;
  transition: transform 0.3s ease;
}

.captcha-image:hover {
  transform: scale(1.05);
}

.button-group {
  display: flex;
  justify-content: space-between;
}

.back-to-login-btn {
  width: 51%;
  padding: 12px;
  background-color: #409eff; 
  color: white; 
  font-size: 14px;
  font-weight: bold;
  border-radius: 8px;
  transition: background-color 0.3s ease, transform 0.2s ease;
}
.back-to-login-btn:hover {
  background-color: #66b1ff; 
  transform: translateY(-2px); 
}
.submit-btn {
  width: 40%;
  padding: 12px;
  background-color: #409eff; 
  color: white; 
  font-size: 14px;
  font-weight: bold;
  border-radius: 8px;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.submit-btn:hover {
  background-color: #66b1ff; 
  transform: translateY(-2px); 
}
@media (max-width: 600px) {
  .form-container {
    padding: 20px;
  }

  .form-title {
    font-size: 20px;
  }
}

.required {
  color: red;
}

.el-button {
  background-color: #409eff; 
  color: white; 
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.el-button:hover {
  background-color: #66b1ff; 
  transform: translateY(-2px); 
}
</style>
