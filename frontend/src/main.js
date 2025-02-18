import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";

import router from "./routers/index";

import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";

import request from "./services/request";

import Antd from 'ant-design-vue';
// import 'ant-design-vue/dist/antd.css';


const app = createApp(App);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}
app.use(Antd).use(router).use(ElementPlus).use(request).mount("#app");
