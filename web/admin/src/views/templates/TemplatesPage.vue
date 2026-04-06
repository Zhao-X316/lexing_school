<template>
  <div class="templates-page">
    <div class="page-header">
      <h1 class="page-title">模板管理</h1>
      <el-upload
        :show-file-list="false"
        :before-upload="handleUpload"
        accept=".xlsx,.xls,.docx,.doc"
      >
        <el-button type="primary">
          <el-icon><Upload /></el-icon>
          上传模板
        </el-button>
      </el-upload>
    </div>
    <el-alert
      type="info"
      :closable="false"
      show-icon
      class="tip-alert"
    >
      支持 .xlsx、.xls、.docx、.doc 格式上传。Excel 模板支持 HTML 表格预览；Word 模板需配置 LibreOffice 后生成 PDF 预览。
    </el-alert>
    <el-card shadow="never">
      <el-table v-loading="loading" :data="list" stripe>
        <el-table-column prop="name" label="名称" width="200" />
        <el-table-column prop="file_type" label="类型" width="100">
          <template #default="{ row }">{{ row.file_type === 'word' ? 'Word' : 'Excel' }}</template>
        </el-table-column>
        <el-table-column prop="scenario" label="适用场景" min-width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'enabled' ? 'success' : 'info'">
              {{ row.status === 'enabled' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handlePreview(row)">预览</el-button>
            <el-button link type="primary" @click="handleDownload(row)">下载原文件</el-button>
            <el-button link type="primary" @click="toggleStatus(row)">
              {{ row.status === 'enabled' ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Excel HTML 预览弹窗 -->
    <el-dialog
      v-model="previewDialogVisible"
      :title="`预览：${previewTitle}`"
      width="80%"
      destroy-on-close
      class="excel-preview-dialog"
    >
      <el-tabs v-if="previewSheets.length" v-model="activeSheet">
        <el-tab-pane
          v-for="(sheet, i) in previewSheets"
          :key="i"
          :label="sheet.name"
          :name="String(i)"
        >
          <div class="excel-html-preview" v-html="sheet.html"></div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { templatesApi, type Template } from '@/api/templates'

const loading = ref(false)
const list = ref<Template[]>([])
const previewDialogVisible = ref(false)
const previewTitle = ref('')
const previewSheets = ref<Array<{ name: string; html: string }>>([])
const activeSheet = ref('0')

async function loadList() {
  loading.value = true
  try {
    const { data } = await templatesApi.list()
    list.value = data?.data?.list ?? []
  } finally {
    loading.value = false
  }
}

async function handleUpload(file: File) {
  try {
    await templatesApi.upload(file)
    ElMessage.success('上传成功')
    loadList()
  } catch {}
  return false
}

async function handlePreview(row: Template) {
  if (row.file_type === 'excel') {
    try {
      const res = await templatesApi.previewHtml(row.id)
      const payload = res.data?.data
      if (payload?.sheets?.length) {
        previewTitle.value = payload.name || row.name
        previewSheets.value = payload.sheets
        activeSheet.value = '0'
        previewDialogVisible.value = true
      } else {
        ElMessage.error('无法解析 Excel 内容')
      }
    } catch {
      ElMessage.error('预览失败')
    }
    return
  }
  try {
    const res = await templatesApi.preview(row.id)
    const blob = res.data as Blob
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  } catch (e: any) {
    const msg = e?.response?.data
    if (msg instanceof Blob) {
      try {
        const text = await msg.text()
        const json = JSON.parse(text)
        ElMessage.error(json?.message || '预览失败')
      } catch {
        ElMessage.error('该模板暂无 PDF 预览，请使用「下载原文件」')
      }
    } else {
      ElMessage.error('预览失败')
    }
  }
}

async function handleDownload(row: Template) {
  try {
    const res = await templatesApi.download(row.id)
    const blob = res.data as Blob
    const disposition = res.headers?.['content-disposition']
    const match = disposition?.match(/filename\*?=(?:UTF-8'')?([^;]+)/)
    const name = match?.[1]?.trim() || `${row.name}.${row.file_type === 'word' ? 'docx' : 'xlsx'}`
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = decodeURIComponent(name.replace(/^["']|["']$/g, ''))
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('已下载')
  } catch (e: any) {
    const msg = e?.response?.data
    if (msg instanceof Blob) {
      try {
        const text = await msg.text()
        const json = JSON.parse(text)
        ElMessage.error(json?.message || '下载失败')
      } catch {
        ElMessage.error('下载失败')
      }
    } else {
      ElMessage.error('下载失败')
    }
  }
}

async function toggleStatus(row: Template) {
  const next = row.status === 'enabled' ? 'disabled' : 'enabled'
  await templatesApi.update(row.id, { status: next })
  ElMessage.success('已更新')
  loadList()
}

async function handleDelete(row: Template) {
  await ElMessageBox.confirm('确定删除该模板？', '提示', { type: 'warning' })
  await templatesApi.remove(row.id)
  ElMessage.success('已删除')
  loadList()
}

onMounted(loadList)
</script>

<style scoped>
.templates-page .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { margin: 0; font-size: 20px; }
.tip-alert { margin-bottom: 16px; }
.excel-html-preview { overflow-x: auto; max-height: 60vh; }
.excel-html-preview :deep(.excel-preview-table) {
  width: 100%; border-collapse: collapse; font-size: 13px;
}
.excel-html-preview :deep(.excel-preview-table th),
.excel-html-preview :deep(.excel-preview-table td) {
  border: 1px solid var(--el-border-color); padding: 6px 10px; text-align: left;
}
.excel-html-preview :deep(.excel-preview-table th) {
  background: var(--el-fill-color-light); font-weight: 600;
}
</style>
