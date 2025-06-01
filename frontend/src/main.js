import { createApp } from 'vue';
import './style.css';
import App from './App.vue';

import router from './routers/index';

import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

import request from './services/request';

import { createPinia } from 'pinia';
import piniaPluginPersist from 'pinia-plugin-persist';
import store from './store/index';

import util from '@/utils/index';

const app = createApp(App);
app.config.globalProperties.$util = util;

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app
  .use(createPinia().use(piniaPluginPersist))
  .use(store)
  .use(router)
  .use(ElementPlus)
  .use(request)
  .mount('#app');
