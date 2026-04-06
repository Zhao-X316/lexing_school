<template>
  <div class="config-section">
    <el-form :model="form" label-width="100px" @submit.prevent>
      <el-form-item label="主标题">
        <el-input v-model="form.title" placeholder="请输入主标题" />
      </el-form-item>
      
      <el-form-item label="副标题">
        <el-input v-model="form.subtitle" placeholder="请输入副标题" />
      </el-form-item>
      
      <el-form-item label="按钮文字">
        <el-input v-model="form.cta_text" placeholder="请输入按钮文字" />
      </el-form-item>
      
      <el-form-item label="按钮链接">
        <el-input v-model="form.cta_link" placeholder="请输入按钮链接" />
      </el-form-item>
      
      <el-form-item label="背景图">
        <el-input v-model="form.background_image" placeholder="请输入背景图URL" />
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
  title: '',
  subtitle: '',
  background_image: '',
  cta_text: '',
  cta_link: ''
})

const saving = ref(false)

// 加载配置
async function loadConfig() {
  try {
    const { data } = await http.get('/homepage/config/hero')
    if (data.data?.config) {
      form.value = { ...form.value, ...data.data.config }
    }
  } catch (error) {
    console.error('加载配置失败:', error)
  }
}

// 保存配置
async function handleSave() {
  saving.value = true
  try {
    await http.put('/homepage/config/hero', { config: form.value })
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
