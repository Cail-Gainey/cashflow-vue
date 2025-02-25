import Vue from 'vue';
import VueRouter from 'vue-router';
import store from '../store';

Vue.use(VueRouter);

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }, // 明确标记为公开路由
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/Register.vue'),
    meta: { requiresAuth: false }, // 明确标记为公开路由
  },
  {
    path: '/forget',
    name: 'forget',
    component: () => import('../views/Forget.vue'),
    meta: { requiresAuth: false }, // 明确标记为公开路由
  },
  {
    path: '/',
    name: 'home',
    component: () => import('../views/Index.vue'),
    meta: { requiresAuth: true }, // 需要认证
  },
  {
    path: '/funds',
    name: 'funds',
    component: () => import('../views/Funds.vue'),
    meta: { requiresAuth: true }, // 需要认证
  },
];

const router = new VueRouter({
  mode: 'history',
  routes,
});

router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isTokenExpired = await store.dispatch('checkTokenExpired');
  // 如果路由不需要认证，直接放行
  if (!requiresAuth) {
    return next();
  }

  // 如果路由需要认证
  if (requiresAuth) {
    // Token 未过期，允许访问
    if (!isTokenExpired) {
      return next();
    }

    // Token 过期，执行登出并重定向到登录页
    await store.dispatch('logout');
    return next({ name: 'login' });
  }

  // 默认放行
  next();
});

export default router;