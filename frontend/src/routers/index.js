import { createRouter, createWebHistory } from 'vue-router'
import file from '../views/file.vue'

const routes = [
  {
    path: '/',
    name: 'file',
    component: file
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
