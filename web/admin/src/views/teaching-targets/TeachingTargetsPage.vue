<template>
  <div class="teaching-targets-page">
    <div class="page-header">
      <h1 class="page-title">教案库管理</h1>
      <div>
        <el-button type="danger" plain @click="handleClear" style="margin-right: 8px">
          <el-icon><Delete /></el-icon>
          一键清空
        </el-button>
        <el-upload
          :show-file-list="false"
          :before-upload="handleImport"
          accept=".xlsx,.xls"
        >
          <el-button type="success">
            <el-icon><Upload /></el-icon>
            Excel 导入
          </el-button>
        </el-upload>
        <el-button type="primary" @click="handleCreate" style="margin-left: 8px">
          <el-icon><Plus /></el-icon>
          新增目标
        </el-button>
      </div>
    </div>
    <el-card shadow="never">
      <div class="filter-area">
        <el-form :inline="true" :model="filters" class="filter-form">
          <el-form-item label="领域">
            <el-select v-model="filters.major_category" placeholder="全部" clearable filterable multiple collapse-tags style="width: 160px">
              <el-option v-for="v in filterOptions.major_categories" :key="v" :label="v" :value="v" />
            </el-select>
          </el-form-item>
          <el-form-item label="项目">
            <el-select v-model="filters.sub_category" placeholder="全部" clearable filterable multiple collapse-tags style="width: 160px">
              <el-option v-for="v in filterOptions.sub_categories" :key="v" :label="v" :value="v" />
            </el-select>
          </el-form-item>
          <el-form-item label="阶段">
            <el-select v-model="filters.stage" placeholder="全部" clearable filterable multiple collapse-tags style="width: 120px">
              <el-option v-for="v in filterOptions.stages" :key="v" :label="String(v)" :value="v" />
            </el-select>
          </el-form-item>
          <el-form-item label="长期/短期">
            <el-select v-model="filters.target_type" placeholder="全部" clearable style="width: 100px">
              <el-option label="长期" value="long_term" />
              <el-option label="短期" value="short_term" />
            </el-select>
          </el-form-item>
          <el-form-item label="内容">
            <el-input v-model="filters.content" placeholder="模糊搜索" clearable style="width: 160px" @keyup.enter="handleSearch" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">筛选</el-button>
            <el-button @click="handleResetFilters">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      <el-table v-loading="loading" :data="tableData" stripe>
        <template #empty>
          <el-empty description="暂无目标，请导入或新增" />
        </template>
        <el-table-column prop="major_category" label="领域" width="140" />
        <el-table-column prop="sub_category" label="项目" width="120" />
        <el-table-column prop="stage" label="阶段" width="80" />
        <el-table-column prop="target_type" label="长期/短期" width="100">
          <template #default="{ row }">
            {{ row.target_type === 'long_term' ? '长期' : '短期' }}
          </template>
        </el-table-column>
        <el-table-column prop="target_number" label="编号" width="100" show-overflow-tooltip />
        <el-table-column prop="content" label="内容" min-width="300" show-overflow-tooltip />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next"
          @current-change="loadList"
          @size-change="() => { pagination.page = 1; loadList() }"
        />
      </div>
    </el-card>
    <el-dialog v-model="dialogVisible" :title="editId ? '编辑目标' : '新增目标'" width="520">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="领域" prop="major_category">
          <el-input v-model="form.major_category" placeholder="如 CVP、EL" />
        </el-form-item>
        <el-form-item label="项目" prop="sub_category">
          <el-input v-model="form.sub_category" placeholder="如 平衡能力" />
        </el-form-item>
        <el-form-item label="阶段" prop="stage">
          <el-input-number v-model="form.stage" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="长期/短期" prop="target_type">
          <el-select v-model="form.target_type" placeholder="请选择">
            <el-option label="长期" value="long_term" />
            <el-option label="短期" value="short_term" />
          </el-select>
        </el-form-item>
        <el-form-item label="编号" prop="target_number">
          <el-input v-model="form.target_number" placeholder="如 1.1、A-1（可选）" clearable />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="3" placeholder="目标内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { teachingTargetsApi, type TeachingTarget } from '@/api/teachingTargets'

const loading = ref(false)
const tableData = ref<TeachingTarget[]>([])
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const editId = ref<number | null>(null)
const filters = reactive({
  major_category: [] as string[],
  sub_category: [] as string[],
  stage: [] as number[],
  target_type: '' as '' | 'long_term' | 'short_term',
  content: ''
})
const filterOptions = reactive({
  major_categories: [] as string[],
  sub_categories: [] as string[],
  stages: [] as number[]
})
const pagination = reactive({ page: 1, limit: 20, total: 0 })
const form = ref({
  major_category: '',
  sub_category: '',
  stage: 1,
  target_type: 'long_term' as 'long_term' | 'short_term',
  target_number: '',
  content: ''
})
const rules: FormRules = {
  major_category: [{ required: true, message: '请输入领域' }],
  sub_category: [{ required: true, message: '请输入项目' }],
  stage: [{ required: true }],
  target_type: [{ required: true }],
  content: [{ required: true, message: '请输入内容' }]
}

function buildListParams() {
  const p: Record<string, string | number> = {
    page: pagination.page,
    limit: pagination.limit
  }
  if (filters.major_category?.length) p.major_category = filters.major_category.join(',')
  if (filters.sub_category?.length) p.sub_category = filters.sub_category.join(',')
  if (filters.stage?.length) p.stage = filters.stage.join(',')
  if (filters.target_type) p.target_type = filters.target_type
  if (filters.content?.trim()) p.content = filters.content.trim()
  return p
}

async function loadFilterOptions() {
  try {
    const { data } = await teachingTargetsApi.list()
    const list = data?.data?.list ?? []
    filterOptions.major_categories = [...new Set(list.map((r) => r.major_category).filter(Boolean))].sort()
    filterOptions.sub_categories = [...new Set(list.map((r) => r.sub_category).filter(Boolean))].sort()
    filterOptions.stages = [...new Set(list.map((r) => r.stage).filter((n) => n != null))].sort((a, b) => a - b)
  } catch {
    filterOptions.major_categories = []
    filterOptions.sub_categories = []
    filterOptions.stages = []
  }
}

async function loadList() {
  loading.value = true
  try {
    const params = buildListParams()
    const { data } = await teachingTargetsApi.list(params)
    tableData.value = data?.data?.list ?? []
    pagination.total = data?.data?.total ?? 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  loadList()
}

function handleResetFilters() {
  filters.major_category = []
  filters.sub_category = []
  filters.stage = []
  filters.target_type = ''
  filters.content = ''
  pagination.page = 1
  loadList()
}

async function handleImport(file: File) {
  try {
    const { data } = await teachingTargetsApi.importExcel(file)
    ElMessage.success(data?.message ?? '导入成功')
    loadFilterOptions()
    pagination.page = 1
    loadList()
  } catch {
    // error already shown by interceptor
  }
  return false
}

function handleCreate() {
  editId.value = null
  form.value = {
    major_category: '',
    sub_category: '',
    stage: 1,
    target_type: 'long_term',
    target_number: '',
    content: ''
  }
  dialogVisible.value = true
}

function handleEdit(row: TeachingTarget) {
  editId.value = row.id
  form.value = {
    major_category: row.major_category,
    sub_category: row.sub_category,
    stage: row.stage,
    target_type: row.target_type,
    target_number: row.target_number ?? '',
    content: row.content
  }
  dialogVisible.value = true
}

async function submitForm() {
  await formRef.value?.validate()
  try {
    if (editId.value) {
      await teachingTargetsApi.update(editId.value, form.value)
      ElMessage.success('更新成功')
    } else {
      await teachingTargetsApi.create(form.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadFilterOptions()
    loadList()
  } catch (e) {
    if (e !== false) {}
  }
}

async function handleDelete(row: TeachingTarget) {
  await ElMessageBox.confirm('确定删除该目标？', '提示', { type: 'warning' })
  await teachingTargetsApi.remove(row.id)
  ElMessage.success('已删除')
  loadFilterOptions()
  loadList()
}

async function handleClear() {
  await ElMessageBox.confirm(
    '确定清空全部教案库目标？此操作不可恢复。',
    '提示',
    { type: 'warning' }
  )
  try {
    const { data } = await teachingTargetsApi.clear()
    ElMessage.success(data?.message ?? '已清空')
    loadFilterOptions()
    pagination.page = 1
    loadList()
  } catch {
    // error shown by interceptor
  }
}

onMounted(() => {
  loadFilterOptions()
  loadList()
})
</script>

<style scoped>
.teaching-targets-page .page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.page-title { margin: 0; font-size: 20px; }
.filter-area {
  margin-bottom: 16px;
}
.filter-form :deep(.el-form-item) { margin-bottom: 8px; }
.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
