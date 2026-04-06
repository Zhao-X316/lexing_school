<template>
  <div class="config-section">
    <el-form :model="form" label-width="100px" @submit.prevent>
      <el-form-item label="区块标题">
        <el-input v-model="form.title" placeholder="请输入标题" />
      </el-form-item>
      
      <el-form-item label="理念列表">
        <div class="items-list">
          <div v-for="(item, index) in form.items" :key="index" class="item-card">
            <el-card shadow="hover">
              <el-form label-width="60px">
                <el-form-item label="标题">
                  <el-input v-model="item.title" placeholder="请输入标题" />
                </el-form-item>
                <el-form-item label="描述">
                  <el-input v-model="item.description" type="textarea" :rows="2" placeholder="请输入描述" />
                </el-form-item>
                <el-form-item label="图标">
                  <el-input v-model="item.icon" placeholder="请输入图标名称或URL" />
                </el-form-item>
                <el-button type="danger" size="small" @click="removeItem(index)">删除</el-button>
              </el-form>
            </el-card>
          </div>
          <el-button type="primary" plain @click="addItem">+ 添加理念</el-button>
        </div>
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

interface PhilosophyItem {
  title: string
  description: string
  icon: string
}

const form = ref({
  title: '我们的理念',
  items: [] as PhilosophyItem[]
})

const saving = ref(false)

function addItem() {
  form.value.items.push({
    title: '',
    description: '',
    icon: ''
  })
}

function removeItem(index: number) {
  form.value.items.splice(index, 1)
}

async function loadConfig() {
  try {
    const { data } = await http.get('/homepage/config/philosophy')
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
    await http.put('/homepage/config/philosophy', { config: form.value })
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

.items-list {
  width: 100%;
}

.item-card {
  margin-bottom: 16px;
}
</style>
