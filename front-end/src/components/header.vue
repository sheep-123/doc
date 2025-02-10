<template>
  <div class="top">
    <el-button color="#626aef"  @click="toChat">对话</el-button>
    <el-button type="primary" @click="toFile">文档库</el-button>
  </div>
</template>

<script setup>
import { getCurrentInstance } from "vue";
const { proxy } = getCurrentInstance()

const toChat = () => {
  proxy.$router.push({ path: '/chat' })
}

const toFile = () => {
  proxy.$router.push({ path: '/' })
}

</script>

<style>
.top{
  padding: 20px;
}
</style>