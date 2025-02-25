import axios from 'axios';
import store from '../store';

export const baseURL = `http://localhost:8080`;

// 创建一个axios的实例
const service = axios.create({
    baseURL: baseURL,
    timeout: 5000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// 请求拦截器
service.interceptors.request.use(
    config => {
        const token = store.getters.token;
        if (token) {
            config.headers['token'] = token;
        }
        return config;
    },
    error => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// 响应拦截器
service.interceptors.response.use(
    response => {
        if (response.data instanceof Object) {
            const { flag, data, msg } = response.data;

            if (typeof flag !== 'boolean') {
                console.warn('Unexpected response structure:', response.data);
                return Promise.reject(new Error('响应结构异常'));
            }

            if (flag) {
                return data || { data, msg };
            } else {
                const errorMsg = msg || '服务器错误';
                console.error('Response error:', errorMsg);
                return Promise.reject(new Error(errorMsg));
            }
        } else {
            return response.data instanceof Blob ? response : response.data;
        }
    },
    error => {
        console.error('Response error:', error);
        return Promise.reject(error);
    }
);


// 封装API调用
const api = {
    // 验证token    
    async verifyToken() {
        return await service.post(`/api/auth/verify`);
    },
    // 邮箱验证
    async sendEmailCode(email) {
        return await service.post(`/api/auth/sendCode`, { email });
    },
    // 忘记密码
    async forgetPwd(email) {
        return await service.post(`/api/auth/forget`, { email });
    },
    async acceptCode(request) {
        return await service.post(`/api/auth/acceptCode`, request);
    },

    // 用户
    async login(formData) {
        return await service.post(`/api/public/login`, formData);
    },
    async logout() {
        return await service.post(`/api/public/logout`);
    },
    async register(data) {
        return await service.post('/api/public/register', data);
    },
    async saveUsers(formData) {
        return await service.post(`/api/users`, formData);
    },
    async updateUser(userId, formData) {
        return await service.put(`/api/users/${userId}`, formData);
    },
    async updatePwd(formData) {
        return await service.put(`/api/users/forget`, formData);
    },
    async getUserInfo() {
        return await service.get(`/api/secure/info`);
    },
    async getUserInfoById(userId) {
        return await service.get(`/api/users/${userId}`);
    },
    
    // 图片上传
    async uploadAvatar(formData) {
        return await service.post('/api/users/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
    async uploadLedgerImg(formData) {
        return await service.post('/api/ledger/img', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
    // 验证码
    async getCaptcha() {
        return await service.get('/api/verify/sendCode');
    },
    async verifyCode(captchaKey, code) {
        return await service.post('/api/verify/verifyCode', {
            captchaKey,
            inputCode: code
        });
    },

    // 分类
    async getCategory(id) {
        return await service.get(`/api/category/${id}`);
    },
    async addCategory(userId, formData) {
        return await service.post(`/api/category/${userId}`, formData);
    },
    async updateCategory(userId, formData) {
        return await service.put(`/api/category/${userId}`, formData);
    },
    async deleteCategory(userId, id) {
        return await service.delete(`/api/category/${userId}/${id}`);
    },
    async toChildren(userId, id, parentId) {
        return await service.put(`/api/category/${userId}/${id}/${parentId}`)
    },
    async toParent(userId, id) {
        return await service.put(`/api/category/${userId}/${id}`)
    },
    countCategory(userId, id) {
        return service.get(`/api/transaction/${userId}/${id}/count`)
    },
    async transferCategory(userId, oldId, newId) {
        return await service.post(`/api/category/${userId}/${oldId}/${newId}`)
    },
    
    // 记录
    async getTransactionById(userId, ledgerId) {
        return await service.get(`/api/transaction/${userId}/${ledgerId}`);
    },
    async saveTransaction(userId, formData) {
        return await service.post(`/api/transaction/${userId}`, formData);
    },
    async updateTransaction(id, formData) {
        return await service.put(`/api/transaction/${id}`, formData);
    },
    async deleteTransaction(id, formData) {
        return await service.delete(`/api/transaction/${id}`, formData);
    },

    // 资产
    async getFundById(userId) {
        return await service.get(`/api/fund/${userId}`);
    },
    async addFund(userId, formData) {
        return await service.post(`/api/fund/${userId}`, formData);
    },
    async updateFund(userId, id, formData) {
        return await service.put(`/api/fund/${userId}/${id}`, formData);
    },
    async deleteFund(userId, id) {
        return await service.delete(`/api/fund/${userId}/${id}`);
    },

    // 账本
    async getLedgerById(userId) {
        return await service.get(`/api/ledger/${userId}`);
    },
    async createLedger(userId, formData) {
        return await service.post(`/api/ledger/${userId}`, formData);
    },
    async updateLedger(userId, formData) {
        return await service.put(`/api/ledger/${userId}`, formData);
    },
    async clean(userId, ledgerId, formData) {
        return await service.put(`/api/ledger/clean/${userId}/${ledgerId}`, formData);
    },
    async removeLedger(userId, ledgerId, formData) {
        return await service.put(`/api/ledger/remove/${userId}/${ledgerId}`, formData);
    },
    async shiftLedger(userId, oldId, newId) {
        return await service.put(`/api/ledger/shift/${userId}/${oldId}/${newId}`);
    },

    // 详细
    async getDetail(userId, fundId) {
        return await service.get(`/api/detail/${userId}/${fundId}`);
    },
};

export default api;
