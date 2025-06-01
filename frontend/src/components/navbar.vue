<template>
  <div class="nav">
    <div class="nav-left">
      <div style="width: 30px; height: 30px; margin-top: 5px">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path>
        </svg>
      </div>
      <p class="title">文档上传</p>
    </div>

    <div class="nav-right">
      <div class="left">
        <el-autocomplete
          v-model="searchQuery"
          :fetch-suggestions="querySearch"
          clearable
          class="inline-input w-50"
          placeholder="请输入文档名字"
          @select="handleSelect"
          :trigger-on-focus="false"
          style="width: 300px"
        />

        <el-button
          type="primary"
          icon="Search"
          @click="searchDocuments"
          style="margin-left: 10px"
          :loading="loading"
          >搜索</el-button
        >
        <el-button
          type="info"
          icon="Refresh"
          @click="resetAll"
          plain
          style="color: black"
          :loading="loading1"
          >重置</el-button
        >
      </div>

      <el-dropdown>
        <div class="avatar">
          <el-avatar :size="25" :src="circleUrl" />
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { ref, getCurrentInstance, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

const { proxy } = getCurrentInstance();
const searchQuery = ref('');

onMounted(() => {
  getQuerySearch();
});

const restaurants = ref([]);
const getQuerySearch = async () => {
  const result = await proxy.$POST({
    url: '/file/getquerysearch'
  });

  if (result.code == 0) {
    ElMessage(result.msg);
    return;
  }

  if (result.code == 1) {
    result.data.forEach((item) => {
      restaurants.value.push({
        value: item
      });
    });
  }
};

const circleUrl = ref('/assets/images/avatar.jpg');

const logout = () => {
  proxy.$router.push('/');
};

const querySearch = (queryString, cb) => {
  const results = queryString
    ? restaurants.value.filter(createFilter(queryString))
    : restaurants.value;
  cb(results);
};

const createFilter = (queryString) => {
  return (restaurant) => {
    return (
      restaurant.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0
    );
  };
};
const loading = ref(false);
const searchDocuments = proxy.$util.throttle(() => {
  if (loading == true) return;
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    proxy.$emit('search', searchQuery.value);
  }, 500);
}, 1000);

const loading1 = ref(false);
const resetAll = proxy.$util.throttle(() => {
  if (loading1 == true) return;
  loading1.value = true;
  searchQuery.value = '';
  setTimeout(() => {
    loading1.value = false;
    proxy.$emit('reset');
  }, 500);
}, 1000);

const handleSelect = (item) => {
  searchQuery.value = item.value;
  searchDocuments();
};
</script>

<style lang="scss" scoped>
.nav {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  // z-index: 10000;
  height: 65px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: white;
  border-bottom: 1px solid #e5e7eb;
  .nav-left {
    display: flex;
    align-items: center;
    margin-left: 30px;
    gap: 11px;

    @media screen and (max-width: 640px) {
      margin-left: 23px;
    }
    .title {
      font-size: 27px;
      font-weight: 800;
      color: #393939;
      letter-spacing: -2px;
    }
  }

  .nav-right {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-right: 50px;
    .left {
      box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3),
        -2px 0px 4px rgba(0, 0, 0, 0.3);
      padding: 5px;
      border-radius: 10px;
    }
    .avatar {
      width: 35px;
      height: 35px;
      box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3),
        -2px 0px 4px rgba(0, 0, 0, 0.3);
      border-radius: 10px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
}
</style>
