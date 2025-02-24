import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'file',
    component: () => import('@/views/file.vue')
  },
  {
    path:"/login",
    name:"login",
    component:()=>import('@/views/login.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
