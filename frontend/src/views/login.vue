<template>
    <div class="login-container">

        <el-card class="login-card">
            <div class="img">
                <img src="/assets/images/珠江航务.png" alt="">
            </div>
            <h2 class="login-title">用户登录</h2>
            <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" @submit.prevent="handleLogin">
                <el-form-item prop="username">
                    <el-input v-model="loginForm.username" placeholder="请输入账号" prefix-icon="User" clearable />
                </el-form-item>

                <el-form-item prop="password">
                    <el-input v-model="loginForm.password" placeholder="请输入密码" prefix-icon="Lock" show-password
                        clearable />
                </el-form-item>

                <el-button type="primary" native-type="submit" class="login-btn" :loading="loading">
                    立即登录
                </el-button>
            </el-form>
        </el-card>
    </div>
</template>

<script setup>
import { ref, reactive, getCurrentInstance } from 'vue'
import { ElMessage } from 'element-plus'

const { proxy } = getCurrentInstance()

const loginForm = reactive({
    username: 'admin',
    password: '123456'
})

const loginRules = reactive({
    username: [
        { required: true, message: '账号不能为空', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '密码不能为空', trigger: 'blur' }
    ]
})

const loading = ref(false)
const loginFormRef = ref(null)

const handleLogin = () => {
    loginFormRef.value.validate(valid => {
        if (!valid) return

        loading.value = true
        // 模拟登录请求
        setTimeout(() => {
            loading.value = false
            ElMessage.success('登录成功')
            proxy.$router.push('/')
        }, 1000)
    })
}
</script>

<style scoped>
@import url('/assets/css/login.css')
</style>
