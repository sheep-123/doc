import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/file',
    name: 'file',
    component: () => import('@/views/file.vue')
  },
  {
    path: '/',
    name: 'login',
    component: () => import('@/views/login.vue')
  },
  {
    path: '/repassword',
    name: 'repassword',
    component: () => import('@/views/repassword.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
