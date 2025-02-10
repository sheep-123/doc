import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";

import router from "./routers/index.js";

import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";

import request from "./services/request.js";


const app = createApp(App);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}
app.use(OfficeTool).use(router).use(ElementPlus).use(request).mount("#app");
