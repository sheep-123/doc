import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'file',
    component: () => import('@/views/file.vue')
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
