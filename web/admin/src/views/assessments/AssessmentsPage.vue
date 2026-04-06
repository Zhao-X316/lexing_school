<template>
  <div class="assessments-page">
    <div class="page-header">
      <h1 class="page-title">评估与教案</h1>
    </div>

    <el-card shadow="never">
      <el-form :inline="true" class="filter-form">
        <el-form-item label="选择学生">
          <el-select
            v-model="selectedStudentId"
            placeholder="请选择学生"
            filterable
            clearable
            style="width: 220px"
          >
            <el-option
              v-for="s in students"
              :key="s.id"
              :label="s.name"
              :value="s.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="userStore.isAdmin" label="状态">
          <el-radio-group v-model="statusFilter">
            <el-radio-button label="active">生效</el-radio-button>
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="void">已作废</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :disabled="!selectedStudentId"
            @click="goToGenerate"
          >
            生成新教案
          </el-button>
        </el-form-item>
      </el-form>

      <template v-if="selectedStudentId">
        <div v-if="historySummary" class="history-summary">
          <span>历史教案：共 {{ historySummary.total_count }} 份</span>
          <span v-if="historySummary.latest_date" class="latest">
            最近评估：{{ historySummary.latest_date }}
          </span>
        </div>

        <div v-if="historyList.length" class="batch-actions">
          <el-button size="small" @click="toggleSelectAll">
            {{ isAllSelected ? '取消全选' : '全选' }}
          </el-button>
          <span class="selection-tip">全选当前列表</span>
          <span v-if="selectedRows.length">已选 {{ selectedRows.length }} 条</span>
        </div>

        <el-table
          ref="tableRef"
          v-loading="historyLoading"
          :data="historyList"
          stripe
          class="history-table"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="48" :selectable="checkSelectable" />
          <el-table-column prop="student_name" label="学生" width="100" />
          <el-table-column prop="assessment_date" label="评估日期" width="120" />
          <el-table-column prop="status" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'info'">
                {{ row.status === 'active' ? '生效' : '已作废' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="180" />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.status === 'active'"
                link
                type="warning"
                @click="handleVoid(row)"
              >
                作废
              </el-button>
              <el-button
                v-else-if="row.status === 'void' && userStore.isAdmin"
                link
                type="danger"
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!historyLoading && historyList.length === 0" description="暂无历史教案" />
      </template>
      <el-empty v-else description="请先选择学生" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { TableInstance } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { studentsApi, type Student } from '@/api/students'
import { assessmentsApi, type Assessment, type AssessmentsListResponse } from '@/api/assessments'

const router = useRouter()
const userStore = useUserStore()
const students = ref<Student[]>([])
const selectedStudentId = ref<number | null>(null)
const statusFilter = ref<'active' | 'void' | 'all'>('active')
const historyList = ref<Assessment[]>([])
const historyLoading = ref(false)
const historySummary = ref<{ total_count: number; latest_date: string | null } | null>(null)
const tableRef = ref<TableInstance | null>(null)
const selectedRows = ref<Assessment[]>([])

async function loadStudents() {
  const { data } = await studentsApi.list()
  students.value = data?.data?.list ?? []
}

async function loadHistory() {
  if (!selectedStudentId.value) {
    historyList.value = []
    historySummary.value = null
    return
  }
  historyLoading.value = true
  try {
    const status = userStore.isAdmin && statusFilter.value !== 'active' ? statusFilter.value : undefined
    const { data } = await assessmentsApi.list(selectedStudentId.value, status)
    const res = data?.data as AssessmentsListResponse | undefined
    historyList.value = res?.list ?? []
    historySummary.value = {
      total_count: res?.total_count ?? historyList.value.length,
      latest_date: res?.latest_date ?? (historyList.value[0]?.assessment_date ?? null)
    }
  } finally {
    historyLoading.value = false
    await clearSelectionSafely()
  }
}

async function clearSelectionSafely() {
  await nextTick()
  tableRef.value?.clearSelection()
  selectedRows.value = []
}

function handleSelectionChange(rows: Assessment[]) {
  selectedRows.value = rows
}

function checkSelectable(_row: Assessment) {
  return true
}

const selectableRowCount = computed(() =>
  historyList.value.filter((row) => checkSelectable(row)).length
)
const isAllSelected = computed(() =>
  selectableRowCount.value > 0 && selectedRows.value.length === selectableRowCount.value
)

function toggleSelectAll() {
  tableRef.value?.toggleAllSelection()
}

function goToGenerate() {
  if (!selectedStudentId.value) {
    ElMessage.warning('请先选择学生')
    return
  }
  router.push({ path: '/assessments/generate', query: { student_id: String(selectedStudentId.value) } })
}

async function handleVoid(row: Assessment) {
  await ElMessageBox.confirm('确定作废该教案？作废后不再参与图表统计。', '提示', { type: 'warning' })
  await assessmentsApi.void(row.id)
  ElMessage.success('已作废')
  loadHistory()
}

async function handleDelete(row: Assessment) {
  await ElMessageBox.confirm('确定永久删除该教案？此操作不可恢复。', '警告', { type: 'warning' })
  await assessmentsApi.remove(row.id)
  ElMessage.success('已删除')
  loadHistory()
}

loadStudents()
watch([selectedStudentId, statusFilter], async () => {
  await loadHistory()
})
</script>

<style scoped>
.assessments-page .page-header { margin-bottom: 16px; }
.page-title { margin: 0; font-size: 20px; }
.filter-form { margin-bottom: 16px; }
.history-summary {
  margin-bottom: 12px;
  font-size: 14px;
  color: #606266;
}
.history-summary .latest { margin-left: 24px; }
.batch-actions {
  margin-bottom: 12px;
  font-size: 14px;
  color: #606266;
}
.batch-actions .selection-tip { margin: 0 12px; }
.history-table { margin-top: 8px; }
</style>
