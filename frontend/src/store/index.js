import { defineStore } from 'pinia';
import { storeToRefs } from 'pinia';
const useStore = new defineStore('file', {
  state() {
    return {
      token: '',
      user: {}
    };
  },
  persist: {
    enabled: true, //开启数据持久化
    strategies: [
      {
        key: 'file',
        storage: localStorage
      }
    ]
  }
});

export default {
  install(app) {
    const store = useStore();
    const { token, user } = storeToRefs(store);
    app.config.globalProperties.$store = store;
    app.config.globalProperties.$token = token;
    app.config.globalProperties.$user = user;
  }
};
