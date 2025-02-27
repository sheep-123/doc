<template>
    <div class="password-container">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="password-form">
            <el-form-item label="旧密码" prop="oldPassword">
                <el-input v-model="form.oldPassword" type="password" show-password placeholder="请输入旧密码" />
            </el-form-item>

            <el-form-item label="新密码" prop="newPassword">
                <el-input v-model="form.newPassword" type="password" show-password placeholder="8-20位字母、数字或符号组合" />
            </el-form-item>

            <el-form-item label="确认密码" prop="confirmPassword">
                <el-input v-model="form.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
            </el-form-item>

            <el-form-item>
                <el-button type="primary" @click="onSubmit" :loading="submitting">
                    提交修改
                </el-button>
                <!-- <router-link to="/forgot-password" class="forgot-link">
                    忘记密码？
                </router-link> -->
            </el-form-item>
        </el-form>
    </div>
</template>

<script setup>
import { ref, reactive, getCurrentInstance } from 'vue'
import { ElMessage } from 'element-plus'

const { proxy } = getCurrentInstance()

const formRef = ref()
const submitting = ref(false)

const form = reactive({
    oldPassword: '123456',
    newPassword: '88888888',
    confirmPassword: '88888888'
})

const validateConfirm = (rule, value, callback) => {
    if (value !== form.newPassword) {
        callback(new Error('两次输入的密码不一致'))
    } else {
        callback()
    }
}

const rules = reactive({
    oldPassword: [
        { required: true, message: '请输入旧密码', trigger: 'blur' }
    ],
    newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 8, max: 20, message: '长度需为8-20个字符', trigger: 'blur' }
    ],
    confirmPassword: [
        { required: true, message: '请确认新密码', trigger: 'blur' },
        { validator: validateConfirm, trigger: 'blur' }
    ]
})

const onSubmit = () => {
    formRef.value.validate(async (valid) => {
        if (!valid) return

        submitting.value = true
        // 这里调用修改密码API
        form.username = proxy.$user.value.username
        var result = await proxy.$POST({
            url: '/user/repassword',
            params: form
        })
        ElMessage.success(result.msg)
        setTimeout(() => {
            if (result.code == 0) {
                formRef.value.resetFields()
                return

            }
            else if (result.code == 1) {
                const url = `http://192.168.30.23:7860?token=${proxy.$token.value}`;
                window.location.href = url;
            }
        }, 1000);



    })
}
</script>

<style scoped>
.password-container {
    display: flex;
    justify-content: center;
    position: absolute;
    top: 0%;
    left: 0%;
    right: 0%;
    bottom: 0%;
    margin: auto;
    height: 240px;
    width: 600px;
    border-radius: 50px;
}

.password-form {
    width: 600px;
    padding: 30px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.forgot-link {
    margin-left: 20px;
    color: #409eff;
    text-decoration: none;
    font-size: 14px;
}
</style>