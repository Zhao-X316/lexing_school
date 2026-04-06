<template>
  <div class="student-profile-page">
    <div class="page-header">
      <el-button link @click="router.back()">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h1 class="page-title">{{ student?.name ?? '学生档案' }}</h1>
    </div>
    <el-card v-if="student" shadow="never" class="hours-card">
      <h4>课时</h4>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="总课时">{{ student.total_hours }}</el-descriptions-item>
        <el-descriptions-item label="已用">{{ student.used_hours }}</el-descriptions-item>
        <el-descriptions-item label="剩余">{{ student.remaining_hours }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
    <el-row :gutter="24" style="margin-top: 16px">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>能力雷达图</template>
          <div class="chart-box">
            <svg v-if="radarData" viewBox="0 0 320 320" class="chart-svg">
              <polygon
                v-for="level in radarLevels"
                :key="level"
                :points="getRadarGridPoints(level)"
                class="radar-grid"
              />
              <line
                v-for="axis in radarAxes"
                :key="axis.key"
                :x1="radarCenter"
                :y1="radarCenter"
                :x2="axis.x"
                :y2="axis.y"
                class="radar-axis"
              />
              <polygon :points="radarValuePoints" class="radar-area" />
              <circle
                v-for="point in radarValueDots"
                :key="point.key"
                :cx="point.x"
                :cy="point.y"
                r="3"
                class="radar-dot"
              />
              <text
                v-for="label in radarAxes"
                :key="`${label.key}-label`"
                :x="label.labelX"
                :y="label.labelY"
                class="radar-label"
              >
                {{ label.name }}
              </text>
            </svg>
            <el-empty v-else description="暂无雷达图数据" />
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>成长折线图</template>
          <div class="chart-box">
            <svg v-if="trendData && trendPoints.length" viewBox="0 0 520 320" class="chart-svg">
              <line
                v-for="tick in trendYAxisTicks"
                :key="tick.value"
                :x1="trendPadding.left"
                :y1="tick.y"
                :x2="trendWidth - trendPadding.right"
                :y2="tick.y"
                class="trend-grid"
              />
              <line
                :x1="trendPadding.left"
                :y1="trendPadding.top"
                :x2="trendPadding.left"
                :y2="trendHeight - trendPadding.bottom"
                class="trend-axis"
              />
              <line
                :x1="trendPadding.left"
                :y1="trendHeight - trendPadding.bottom"
                :x2="trendWidth - trendPadding.right"
                :y2="trendHeight - trendPadding.bottom"
                class="trend-axis"
              />
              <path :d="trendLinePath" class="trend-line" />
              <circle
                v-for="point in trendPoints"
                :key="point.key"
                :cx="point.x"
                :cy="point.y"
                r="4"
                class="trend-dot"
              />
              <text
                v-for="tick in trendYAxisTicks"
                :key="`${tick.value}-label`"
                :x="trendPadding.left - 12"
                :y="tick.y + 4"
                class="trend-y-label"
              >
                {{ tick.value }}
              </text>
              <text
                v-for="point in trendPoints"
                :key="`${point.key}-date`"
                :x="point.x"
                :y="trendHeight - trendPadding.bottom + 24"
                class="trend-x-label"
              >
                {{ point.date }}
              </text>
            </svg>
            <el-empty v-else description="暂无成长曲线数据" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { studentsApi, type Student, type RadarChartData, type TrendChartData } from '@/api/students'

const route = useRoute()
const router = useRouter()
const studentId = ref(Number(route.params.id))
const student = ref<Student | null>(null)
const radarData = ref<RadarChartData | null>(null)
const trendData = ref<TrendChartData | null>(null)

const radarCenter = 160
const radarRadius = 105
const radarLevels = [1, 2, 3, 4, 5]
const trendWidth = 520
const trendHeight = 320
const trendPadding = {
  top: 24,
  right: 24,
  bottom: 48,
  left: 40
}

const radarAxes = computed(() => {
  const indicators = radarData.value?.indicator ?? []
  return indicators.map((item, index) => {
    const angle = (-Math.PI / 2) + (index * Math.PI * 2) / indicators.length
    const x = radarCenter + Math.cos(angle) * radarRadius
    const y = radarCenter + Math.sin(angle) * radarRadius
    const labelX = radarCenter + Math.cos(angle) * (radarRadius + 18)
    const labelY = radarCenter + Math.sin(angle) * (radarRadius + 18)

    return {
      key: `${item.name}-${index}`,
      name: item.name,
      x,
      y,
      labelX,
      labelY,
      max: item.max || 5
    }
  })
})

const radarValueDots = computed(() => {
  const values = radarData.value?.values ?? []
  return radarAxes.value.map((axis, index) => {
    const ratio = Math.max(0, Math.min(1, (values[index] ?? 0) / axis.max))
    return {
      key: axis.key,
      x: radarCenter + (axis.x - radarCenter) * ratio,
      y: radarCenter + (axis.y - radarCenter) * ratio
    }
  })
})

const radarValuePoints = computed(() =>
  radarValueDots.value.map((point) => `${point.x},${point.y}`).join(' ')
)

const trendMaxScore = computed(() => {
  const scores = trendData.value?.scores ?? []
  const maxScore = scores.length ? Math.max(...scores) : 5
  return Math.max(5, Math.ceil(maxScore))
})

const trendYAxisTicks = computed(() => {
  const ticks = []
  for (let value = 0; value <= trendMaxScore.value; value += 1) {
    ticks.push({
      value,
      y: mapTrendY(value)
    })
  }
  return ticks
})

const trendPoints = computed(() => {
  const dates = trendData.value?.dates ?? []
  const scores = trendData.value?.scores ?? []
  if (!dates.length) return []

  const usableWidth = trendWidth - trendPadding.left - trendPadding.right
  const step = dates.length === 1 ? 0 : usableWidth / (dates.length - 1)

  return dates.map((date, index) => ({
    key: `${date}-${index}`,
    date,
    score: scores[index] ?? 0,
    x: trendPadding.left + step * index,
    y: mapTrendY(scores[index] ?? 0)
  }))
})

const trendLinePath = computed(() => {
  if (!trendPoints.value.length) return ''
  return trendPoints.value
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
})

function getRadarGridPoints(level: number) {
  const ratio = level / radarLevels[radarLevels.length - 1]
  return radarAxes.value
    .map((axis) => {
      const x = radarCenter + (axis.x - radarCenter) * ratio
      const y = radarCenter + (axis.y - radarCenter) * ratio
      return `${x},${y}`
    })
    .join(' ')
}

function mapTrendY(score: number) {
  const usableHeight = trendHeight - trendPadding.top - trendPadding.bottom
  return trendHeight - trendPadding.bottom - (Math.max(0, score) / trendMaxScore.value) * usableHeight
}

async function loadStudent() {
  const { data } = await studentsApi.getById(studentId.value)
  student.value = data?.data ?? null
}

async function loadRadar() {
  const { data } = await studentsApi.getRadarChart(studentId.value)
  radarData.value = data?.data ?? null
}

async function loadTrend() {
  const { data } = await studentsApi.getTrendChart(studentId.value)
  trendData.value = data?.data ?? null
}

async function loadPage() {
  await loadStudent()
  if (student.value) {
    await Promise.all([loadRadar(), loadTrend()])
  }
}

onMounted(loadPage)

watch(
  () => route.params.id,
  async (id) => {
    studentId.value = Number(id)
    await loadPage()
  }
)
</script>

<style scoped>
.student-profile-page .page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.page-title {
  margin: 0;
  font-size: 20px;
}

.hours-card h4 {
  margin: 0 0 12px;
  font-size: 14px;
}

.chart-box {
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-svg {
  width: 100%;
  height: 320px;
}

.radar-grid,
.radar-axis,
.trend-grid,
.trend-axis {
  fill: none;
  stroke: #dcdfe6;
  stroke-width: 1;
}

.radar-area {
  fill: rgba(64, 158, 255, 0.2);
  stroke: #409eff;
  stroke-width: 2;
}

.radar-dot {
  fill: #409eff;
}

.radar-label,
.trend-x-label,
.trend-y-label {
  fill: #606266;
  font-size: 11px;
  text-anchor: middle;
}

.trend-y-label {
  text-anchor: end;
}

.trend-line {
  fill: none;
  stroke: #67c23a;
  stroke-width: 3;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.trend-dot {
  fill: #67c23a;
}
</style>
