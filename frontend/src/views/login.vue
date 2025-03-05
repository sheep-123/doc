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
        { required: true, message: '用户名不能为空', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '密码不能为空', trigger: 'blur' }
    ]
})

const loading = ref(false)
const loginFormRef = ref(null)

const handleLogin = () => {
    loginFormRef.value.validate(async (valid) => {
        if (!valid) return

        loading.value = true
        var result = await proxy.$POST({
            url: '/user/login',
            params: loginForm
        })

        if (result.code === 0) {
            loading.value = false
            ElMessage.error(result.msg);
            return;
        }

        else if (result.code === 1) {
            loading.value = false
            ElMessage.success(result.msg)
            // return
            setTimeout(() => {
                proxy.$token.value = result.data.token;
                proxy.$user.value = result.data.user;
                // proxy.$router.push('/file')
                if (result.data.status === "repassword") {
                    proxy.$router.push('/repassword')
                } else if (result.data.status === "success") {
                    proxy.$router.push('/file')
                    // const url = `http://192.168.30.23:7860?token=${proxy.$token.value}`;
                    // window.location.href = url;
                }
            }, 1000);
        }
    })
}
</script>

<style scoped>
@import url('/assets/css/login.css')
</style>
