<template>
  <div class="config-section">
    <el-form :model="form" label-width="100px" @submit.prevent>
      <el-form-item label="学校地址">
        <el-input v-model="form.address" placeholder="请输入学校地址" />
      </el-form-item>
      
      <el-form-item label="联系电话">
        <el-input v-model="form.phone" placeholder="请输入联系电话" />
      </el-form-item>
      
      <el-form-item label="电子邮箱">
        <el-input v-model="form.email" placeholder="请输入电子邮箱" />
      </el-form-item>
      
      <el-form-item label="微信公众号">
        <el-input v-model="form.wechat" placeholder="请输入微信公众号" />
      </el-form-item>
      
      <el-form-item label="工作时间">
        <el-input v-model="form.working_hours" placeholder="请输入工作时间" />
      </el-form-item>
      
      <el-form-item label="地图坐标">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-input v-model="form.latitude" placeholder="纬度" />
          </el-col>
          <el-col :span="12">
            <el-input v-model="form.longitude" placeholder="经度" />
          </el-col>
        </el-row>
      </el-form-item>
      
      <el-form-item>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { http } from '@/api/request'

const form = ref({
  address: '',
  phone: '',
  email: '',
  wechat: '',
  working_hours: '',
  latitude: '',
  longitude: ''
})

const saving = ref(false)

async function loadConfig() {
  try {
    const { data } = await http.get('/homepage/config/contact')
    if (data.data?.config) {
      form.value = { ...form.value, ...data.data.config }
    }
  } catch (error) {
    console.error('加载配置失败:', error)
  }
}

async function handleSave() {
  saving.value = true
  try {
    await http.put('/homepage/config/contact', { config: form.value })
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadConfig()
})
</script>

<style scoped>
.config-section {
  padding: 20px;
}
</style>
