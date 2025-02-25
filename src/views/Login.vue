<template>
  <div id="app">
    <div class="bg1">
      <div class="login-container">
        <div class="login-form">
          <el-form :model="loginForm" :rules="loginRules" ref="loginForm" @keyup.enter.native="handleLogin">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="loginForm.email" type="email" placeholder="请输入邮箱"></el-input>
            </el-form-item>

            <el-form-item label="密码" prop="password">
              <el-input v-model="loginForm.password" :type="passwordVisible ? 'text' : 'password'" placeholder="请输入密码">
                <template #suffix>
                  <i 
                    @mousedown="showPassword" 
                    @mouseup="hidePassword" 
                    @mouseleave="hidePassword" 
                    :class="passwordVisible ? 'fa fa-eye' : 'fa fa-eye-slash'" 
                    style="cursor: pointer;">
                  </i>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item>
              <el-checkbox v-model="loginForm.rememberMe">3天免登录</el-checkbox>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleLogin" :loading="loginLoading" style="width: 100%;">登录</el-button>
            </el-form-item>

            <el-form-item>
              <span>还没有账号？</span>
              <el-button class="register-btn" @click="toRegister" style="padding: 0;">注册</el-button>
              <el-button class="forget-password-btn" @click="toForgetPassword" style="padding: 0;">忘记密码？</el-button>
            </el-form-item>
          </el-form>

          <el-dialog :visible.sync="dialogVisible" title="验证码验证" width="300px" center class="captcha-dialog" @keyup.enter.native="verifyCaptcha">
            <div class="captcha-content">
              <img :src="captchaImage" alt="验证码" class="captcha-image" @click="reloadCaptcha" />
              <el-input v-model="userInputCaptcha" placeholder="请输入验证码" class="captcha-input" ref="captchaInput"></el-input>
            </div>
            <span slot="footer" class="dialog-footer">
              <el-button type="primary" @click="verifyCaptcha" :loading="loading">验证并登录</el-button>
            </span>
          </el-dialog>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/api/api';
import { mapActions } from 'vuex';
import 'font-awesome/css/font-awesome.css';

export default {
  data() {
    return {
      loginForm: {
        email: '',
        password: '',
        rememberMe: false,
      },
      loginRules: {
        email: [
          { required: true, message: '请输入邮箱地址', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
        ]
      },
      loginLoading: false,
      captchaImage: null,
      captchaKey: '',
      userInputCaptcha: '',
      dialogVisible: false,
      isCaptchaVerified: false,
      loading: false,
      loginSuccess: false,
      captchaVerified: false,
      passwordVisible: false,
    };
  },
  methods: {
    ...mapActions(['login']),
    async handleLogin() {
      if (this.loginLoading) return;
      this.$refs.loginForm.validate(async (valid) => {
        if (!valid) {
          this.showErrorMessage('请填写所有必填字段');
          return;
        }
        this.dialogVisible = true;
        await this.reloadCaptcha();
        this.$nextTick(() => {
          this.$refs.captchaInput.focus();
        });
      });
    },
    toRegister() {
      this.$router.push('/register');
    },
    toForgetPassword() {
      this.$router.push('/forget');
    },
    showErrorMessage(message) {
      this.$message.error(message);
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
          if (!this.captchaVerified) {
            this.$message.success('验证码验证成功');
            this.captchaVerified = true;
          }
          this.isCaptchaVerified = true;
          this.dialogVisible = false;
          await this.performLogin();
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
    async performLogin() {
      if (this.loginSuccess) return;
      this.loginLoading = false;
      this.loading = true;
      try {
        const response = await api.login(this.loginForm);
        if (response) {
          const token = response;
          await this.$store.dispatch('login', token);
          const userInfoPromise = this.$store.dispatch('getUserInfo');
          await Promise.all([userInfoPromise]);
          this.loginSuccess = true;
          this.$message.success('登录成功');
          await new Promise(resolve => setTimeout(resolve, 1000));
          if (this.$route.name !== 'home') {
            this.$router.push({ name: 'home' });
          }
        } else {
          this.showErrorMessage('请填写正确的登录信息');
        }
      } catch (error) {
        console.log(error)
        this.showErrorMessage('登录失败，请检查您的邮箱和密码');
      } finally {
        this.loginLoading = false;
        this.loading = false;
      }
    },
    showPassword() {
      this.passwordVisible = true;
    },
    hidePassword() {
      this.passwordVisible = false;
    },
  },
};
</script>

<style scoped>
body {
  background-color: #f0f2f5;
  margin: 0;
  height: 100vh;
}

#app {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.bg1 {
  background-image: url('@/assets/bg1.png');
  background-size: cover;
  background-position: center;
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.login-form {
  max-width: 400px;
  padding: 40px;
  border-radius: 15px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23);
  background: rgba(255, 255, 255, 0.8);
  animation: fadeIn 1s, slideIn 0.5s;
}

.el-input__inner {
  border: 1px solid #d3dce6 !important;
  border-radius: 8px;
  padding: 8px;
  transition: border-color 0.2s cubic-bezier(.645,.045,.355,1), box-shadow 0.2s;
  background-color: #f9f9f9;
}

.el-input__inner:focus {
  border-color: #409eff !important;
  box-shadow: 0 0 5px rgba(64, 158, 255, 0.5);
}

.el-form-item {
  margin-bottom: 20px;
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

.el-dialog {
  border-radius: 10px;
  animation: fadeIn 0.5s;
}

.el-dialog__header {
  border-bottom: 1px solid #ebeef5;
  padding: 20px 20px 10px;
}

.el-dialog__title {
  font-size: 18px;
  color: #303133;
}

.el-dialog__body {
  padding: 30px 20px;
}

.el-dialog__footer {
  padding: 10px 20px 20px;
  text-align: right;
}

.captcha-image {
  width: 150px;
  height: auto;
  margin-bottom: 15px;
  border: 1px solid #d3dce6;
  border-radius: 5px;
  cursor: pointer;
  transition: transform 0.2s;
}

.captcha-image:hover {
  transform: scale(1.05);
}

span {
  color: #606266;
}

@media (max-width: 500px) {
  .login-form {
    width: 90%;
    margin: 50px auto;
    padding: 20px;
  }
}

.captcha-dialog {
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.captcha-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.captcha-input {
  width: 100%;
  max-width: 300px;
  border-radius: 5px;
}

.register-btn, .forget-password-btn {
  margin-top: 10px;
  font-size: 16px;
  text-decoration: underline;
  background: none;
  border: none;
}

.register-btn {
  color: #409eff;
}

.register-btn:hover {
  font-weight: bold;
  background: none;
}

.forget-password-btn {
  color: red;
}

.forget-password-btn:hover {
  background: none;
  transform: translateY(-2px);
}
</style>
