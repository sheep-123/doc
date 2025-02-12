import { createRouter, createWebHistory } from 'vue-router'
import file from '../views/file.vue'
import chat from '../views/chat.vue'

const routes = [
  {
    path: '/',
    name: 'file',
    component: file
  },
  {
   path: '/chat',
   name: 'chat',
   component: chat
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
