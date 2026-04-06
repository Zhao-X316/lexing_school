<template>
  <div class="my-children-page">
    <div class="page-header">
      <h1 class="page-title">我的孩子</h1>
      <el-select
        v-model="currentChildId"
        placeholder="请选择孩子"
        filterable
        style="width: 220px"
        @change="onChildChange"
      >
        <el-option
          v-for="s in children"
          :key="s.id"
          :label="s.name"
          :value="s.id"
        />
      </el-select>
    </div>
    <template v-if="currentChild">
      <el-card shadow="never" class="hours-card">
        <h4>课时进度</h4>
        <el-progress
          :percentage="hoursPercent"
          :stroke-width="20"
          :format="() => `${currentChild?.remaining_hours ?? 0} / ${currentChild?.total_hours ?? 0} 剩余`"
        />
        <el-descriptions :column="3" border style="margin-top: 12px">
          <el-descriptions-item label="总课时">{{ currentChild.total_hours }}</el-descriptions-item>
          <el-descriptions-item label="已用">{{ currentChild.used_hours }}</el-descriptions-item>
          <el-descriptions-item label="剩余">{{ currentChild.remaining_hours }}</el-descriptions-item>
        </el-descriptions>
      </el-card>
      <el-card shadow="never" style="margin-top: 16px">
        <template #header>
          <span>成长图表</span>
          <el-button link type="primary" @click="goProfile(currentChild.id)" style="float: right">
            查看档案与图表
          </el-button>
        </template>
        <p class="text-secondary">点击「查看档案与图表」可查看该孩子的能力雷达图与成长折线图。</p>
      </el-card>
      <el-card shadow="never" style="margin-top: 16px">
        <template #header>历史教案（只读）</template>
        <el-table v-loading="historyLoading" :data="historyList" stripe>
          <el-table-column prop="assessment_date" label="评估日期" width="120" />
          <el-table-column prop="status" label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'info'">
                {{ row.status === 'active' ? '生效' : '已作废' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" />
        </el-table>
      </el-card>
    </template>
    <el-empty v-else description="请从上方选择孩子或暂无绑定学生" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { studentsApi, type Student } from '@/api/students'
import { assessmentsApi, type Assessment } from '@/api/assessments'

const router = useRouter()
const children = ref<Student[]>([])
const currentChildId = ref<number | null>(null)
const historyList = ref<Assessment[]>([])
const historyLoading = ref(false)

const currentChild = computed(() =>
  children.value.find((s) => s.id === currentChildId.value) ?? null
)
const hoursPercent = computed(() => {
  const c = currentChild.value
  if (!c || c.total_hours <= 0) return 0
  return Math.round((c.remaining_hours / c.total_hours) * 100)
})

async function loadChildren() {
  const { data } = await studentsApi.list()
  children.value = data?.data?.list ?? []
  if (children.value.length && !currentChildId.value) {
    currentChildId.value = children.value[0].id
  }
}
async function loadHistory() {
  if (!currentChildId.value) {
    historyList.value = []
    return
  }
  historyLoading.value = true
  try {
    const { data } = await assessmentsApi.list(currentChildId.value)
    historyList.value = data?.data?.list ?? []
  } finally {
    historyLoading.value = false
  }
}
function onChildChange() {
  loadHistory()
}
function goProfile(id: number) {
  router.push({ name: 'StudentProfile', params: { id: String(id) } })
}

onMounted(loadChildren)
watch(currentChildId, loadHistory)
</script>

<style scoped>
.my-children-page .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { margin: 0; font-size: 20px; }
.hours-card h4 { margin: 0 0 12px; font-size: 14px; }
.text-secondary { color: #909399; font-size: 14px; margin: 0; }
</style>
