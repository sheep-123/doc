const useStore = new defineStore("product", {
  state() {
    return {
        user:''
    };
  },
  persist: {
    enabled: true, //开启数据持久化
    strategies: [
      {
        key: "test",
        storage: localStorage,
      },
    ],
  },
});

export default {
  install(app) {
    const store = useStore();
    const { user } = storeToRefs(store);

    //挂载
    app.config.globalProperties.$user = user;
    app.config.globalProperties.$store = store;

  },
};
