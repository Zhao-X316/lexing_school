<template>
  <div class="assessment-generate-page">
    <div class="page-header">
      <el-button link type="primary" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h1 class="page-title">生成教案 — {{ studentName || '加载中...' }}</h1>
    </div>

    <el-card shadow="never" v-loading="loading">
      <el-form :inline="true" class="top-form">
        <el-form-item label="模板">
          <el-select v-model="templateId" placeholder="默认模板" clearable style="width: 200px">
            <el-option v-for="t in enabledTemplates" :key="t.id" :label="`${t.name} (${t.file_type === 'excel' ? 'Excel' : 'Word'})`" :value="t.id" />
          </el-select>
        </el-form-item>
      </el-form>

      <el-row :gutter="24" class="main-row">
        <el-col :span="6" class="cascade-col">
          <h4>领域 → 项目 → 阶段</h4>
          <div class="cascade-panel">
            <div class="cascade-section">
              <div class="cascade-label">领域</div>
              <el-radio-group v-model="selectedDomain" class="cascade-options" @change="onDomainChange">
                <el-radio
                  v-for="d in domains"
                  :key="d"
                  :label="d"
                  border
                  size="small"
                >
                  {{ d }}
                </el-radio>
              </el-radio-group>
            </div>
            <div v-if="selectedDomain" class="cascade-section">
              <div class="cascade-label">项目</div>
              <el-radio-group v-model="selectedProject" class="cascade-options" @change="onProjectChange">
                <el-radio
                  v-for="p in projects"
                  :key="p"
                  :label="p"
                  border
                  size="small"
                >
                  {{ p }}
                </el-radio>
              </el-radio-group>
            </div>
            <div v-if="selectedProject" class="cascade-section">
              <div class="cascade-label">阶段</div>
              <el-radio-group v-model="selectedStage" class="cascade-options" @change="onStageChange">
                <el-radio
                  v-for="s in stages"
                  :key="s"
                  :label="s"
                  border
                  size="small"
                >
                  {{ s }}
                </el-radio>
              </el-radio-group>
            </div>
          </div>
        </el-col>

        <el-col :span="18" class="targets-col">
          <template v-if="selectedDomain && selectedProject && selectedStage !== null">
            <h4>勾选目标（领域 {{ selectedDomain }} / 项目 {{ selectedProject }} / 阶段 {{ selectedStage }}）</h4>
            <el-row :gutter="24">
              <el-col :span="12">
                <div class="target-column">
                  <div class="column-title">长期目标</div>
                  <div class="target-list">
                    <div
                      v-for="(t, i) in longTermTargets"
                      :key="t.id"
                      class="target-item"
                      :class="{ checked: isSelected(t.id) }"
                      @click="toggleTarget(t.id)"
                    >
                      <el-checkbox :model-value="isSelected(t.id)" @click.prevent />
                      <span class="target-num">{{ targetDisplayNum(t, i) }}</span>
                      <span class="target-content">{{ t.content }}</span>
                    </div>
                    <el-empty v-if="longTermTargets.length === 0" description="无长期目标" />
                  </div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="target-column">
                  <div class="column-header">
                    <span class="column-title">短期目标</span>
                    <el-checkbox v-model="linkToLongTerm" class="link-option">关联长期目标</el-checkbox>
                  </div>
                  <div class="target-list">
                    <div
                      v-for="(t, i) in shortTermTargets"
                      :key="t.id"
                      class="target-item"
                      :class="{ checked: isSelected(t.id) }"
                      @click="toggleTarget(t.id)"
                    >
                      <el-checkbox :model-value="isSelected(t.id)" @click.prevent />
                      <span class="target-num">{{ targetDisplayNum(t, i) }}</span>
                      <span class="target-content">{{ t.content }}</span>
                    </div>
                    <el-empty v-if="shortTermTargets.length === 0" description="无短期目标" />
                  </div>
                </div>
              </el-col>
            </el-row>
          </template>
          <el-empty v-else description="请先选择领域、项目、阶段" />
        </el-col>
      </el-row>

      <div class="selected-summary" v-if="selectedTargetIds.length > 0">
        已选 {{ selectedTargetIds.length }} 个目标
      </div>

      <div class="bottom-actions">
        <el-button @click="handleSave">保存草稿</el-button>
        <el-button @click="handlePreview" :loading="previewLoading" :disabled="selectedTargetIds.length === 0">
          预览
        </el-button>
        <el-button
          type="primary"
          :loading="generating"
          :disabled="selectedTargetIds.length === 0"
          @click="handleDownload"
        >
          下载教案
        </el-button>
      </div>
    </el-card>

    <el-dialog v-model="showPreview" :title="previewType === 'excel' ? '教案预览 (Excel)' : '教案预览'" width="80%">
      <div v-loading="previewLoading" class="preview-content">
        <div v-if="previewHtml" class="assessment-html-preview" v-html="previewHtml"></div>
        <div v-else-if="!previewLoading" class="preview-empty-hint">模板已命中，但未渲染出可预览内容</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { studentsApi, type Student } from '@/api/students'
import { templatesApi, type Template } from '@/api/templates'
import { teachingTargetsApi, type TeachingTarget } from '@/api/teachingTargets'
import { assessmentsApi } from '@/api/assessments'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const DRAFT_KEY_PREFIX = 'assessment_draft_'

const studentId = ref<number | null>(null)
const studentName = ref('')
const students = ref<Student[]>([])
const templates = ref<Template[]>([])
const targets = ref<TeachingTarget[]>([])
const loading = ref(true)
const generating = ref(false)
const showPreview = ref(false)
const previewLoading = ref(false)
const previewHtml = ref('')
const previewType = ref<'excel' | 'word' | ''>('')

const templateId = ref<number | null>(null)
const enabledTemplates = computed(() => templates.value.filter((t) => t.status === 'enabled'))
const selectedDomain = ref('')
const selectedProject = ref('')
const selectedStage = ref<number | null>(null)
const selectedTargetIds = ref<number[]>([])
const linkToLongTerm = ref(false)

const domains = computed(() => {
  const set = new Set<string>()
  targets.value.forEach((t) => set.add(t.major_category))
  return Array.from(set).sort()
})

const projects = computed(() => {
  if (!selectedDomain.value) return []
  const set = new Set<string>()
  targets.value
    .filter((t) => t.major_category === selectedDomain.value)
    .forEach((t) => set.add(t.sub_category))
  return Array.from(set).sort()
})

const stages = computed(() => {
  if (!selectedDomain.value || !selectedProject.value) return []
  const set = new Set<number>()
  targets.value
    .filter(
      (t) =>
        t.major_category === selectedDomain.value &&
        t.sub_category === selectedProject.value
    )
    .forEach((t) => set.add(t.stage))
  return Array.from(set).sort((a, b) => a - b)
})

const filteredTargets = computed(() => {
  if (!selectedDomain.value || !selectedProject.value || selectedStage.value === null) return []
  return targets.value.filter(
    (t) =>
      t.major_category === selectedDomain.value &&
      t.sub_category === selectedProject.value &&
      t.stage === selectedStage.value
  )
})

const longTermTargets = computed(() =>
  filteredTargets.value.filter((t) => t.target_type === 'long_term')
)
const shortTermTargets = computed(() =>
  filteredTargets.value.filter((t) => t.target_type === 'short_term')
)

function targetDisplayNum(t: TeachingTarget, i: number): string {
  const num = t.target_number?.trim()
  return num ? `${num} ` : `${i + 1}. `
}

function isSelected(id: number) {
  return selectedTargetIds.value.includes(id)
}

/** 从 target_number 提取前缀用于关联（如 5-M、5-a 均取 5） */
function getTargetPrefix(t: TeachingTarget): string {
  const num = t.target_number?.trim() || ''
  const part = num.split('-')[0]?.trim() || ''
  return part
}

/** 获取与某长期目标关联的短期目标 id 列表（同 prefix） */
function getRelatedShortTermIds(longTerm: TeachingTarget): number[] {
  const prefix = getTargetPrefix(longTerm)
  if (!prefix) return []
  return shortTermTargets.value
    .filter((st) => getTargetPrefix(st) === prefix)
    .map((st) => st.id)
}

function toggleTarget(id: number) {
  const idx = selectedTargetIds.value.indexOf(id)
  if (idx >= 0) {
    let toRemove = [id]
    if (linkToLongTerm.value) {
      const longTerm = longTermTargets.value.find((t) => t.id === id)
      if (longTerm) {
        toRemove = [...toRemove, ...getRelatedShortTermIds(longTerm)]
      }
    }
    selectedTargetIds.value = selectedTargetIds.value.filter((x) => !toRemove.includes(x))
  } else {
    let next = [...selectedTargetIds.value, id]
    if (linkToLongTerm.value) {
      const longTerm = longTermTargets.value.find((t) => t.id === id)
      if (longTerm) {
        const relatedIds = getRelatedShortTermIds(longTerm)
        next = [...new Set([...next, ...relatedIds])]
      }
    }
    selectedTargetIds.value = next
  }
}

function onDomainChange() {
  selectedProject.value = ''
  selectedStage.value = null
}

function onProjectChange() {
  selectedStage.value = null
}

function onStageChange() {}

function goBack() {
  router.push('/assessments')
}

function getDraftKey() {
  const uid = userStore.user?.id
  const sid = studentId.value
  if (!uid || !sid) return ''
  return `${DRAFT_KEY_PREFIX}${uid}_${sid}`
}

function loadDraft() {
  const key = getDraftKey()
  if (!key) return
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return
    const draft = JSON.parse(raw) as { target_ids?: number[]; template_id?: number; link_to_long_term?: boolean }
    if (draft.target_ids?.length) {
      selectedTargetIds.value = draft.target_ids
    }
    if (draft.template_id) {
      templateId.value = draft.template_id
    }
    if (draft.link_to_long_term !== undefined) {
      linkToLongTerm.value = draft.link_to_long_term
    }
  } catch {}
}

async function handlePreview() {
  if (!studentId.value || selectedTargetIds.value.length === 0) return
  previewLoading.value = true
  previewHtml.value = ''
  previewType.value = ''
  showPreview.value = true
  try {
    const res = await assessmentsApi.preview({
      student_id: studentId.value,
      target_ids: selectedTargetIds.value,
      template_id: templateId.value ?? undefined
    })
    const payload = res.data?.data
    previewType.value = (payload?.type === 'excel' || payload?.type === 'word' ? payload.type : '') as 'excel' | 'word' | ''
    if (payload?.html) {
      previewHtml.value = payload.html
    } else {
      previewHtml.value = ''
      ElMessage.warning('模板已命中，但未渲染出可预览内容')
    }
  } catch {
    ElMessage.error('预览失败')
  } finally {
    previewLoading.value = false
  }
}

function handleSave() {
  const key = getDraftKey()
  if (!key) {
    ElMessage.warning('无法保存')
    return
  }
  const draft = {
    student_id: studentId.value,
    target_ids: selectedTargetIds.value,
    template_id: templateId.value ?? undefined,
    link_to_long_term: linkToLongTerm.value
  }
  localStorage.setItem(key, JSON.stringify(draft))
  ElMessage.success('草稿已保存')
}

function inferDownloadExt(blob: Blob, selectedTemplate: Template | undefined): string {
  const ct = blob.type || ''
  if (ct.includes('spreadsheet') || ct.includes('vnd.openxmlformats-officedocument.spreadsheetml')) return 'xlsx'
  if (ct.includes('wordprocessing') || ct.includes('msword')) return 'docx'
  const tpl = selectedTemplate ?? templates.value.find((x) => x.id === templateId.value)
  return tpl?.file_type === 'word' ? 'docx' : 'xlsx'
}

async function handleDownload() {
  if (!studentId.value || selectedTargetIds.value.length === 0) return
  generating.value = true
  try {
    const res = await assessmentsApi.generate({
      student_id: studentId.value,
      target_ids: selectedTargetIds.value,
      template_id: templateId.value ?? undefined
    })
    const blob = res.data
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const disposition = res.headers?.['content-disposition']
    let name = disposition?.match(/filename\*?=(?:UTF-8'')?([^;]+)/)?.[1]?.trim()
    if (!name) {
      const ext = inferDownloadExt(blob, templates.value.find((t) => t.id === templateId.value))
      const d = new Date()
      const dateStr = `${d.getFullYear()}年${d.getMonth() + 1}月`
      name = `${studentName.value || '教案'}-${dateStr}.${ext}`
    }
    a.download = decodeURIComponent(name.replace(/^["']|["']$/g, ''))
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('已下载')
  } catch {
    // error handled by interceptor
  } finally {
    generating.value = false
  }
}

async function init() {
  const sid = route.query.student_id
  if (!sid) {
    router.replace('/assessments')
    return
  }
  const id = parseInt(String(sid), 10)
  if (isNaN(id)) {
    router.replace('/assessments')
    return
  }

  loading.value = true
  try {
    const [studentsRes, templatesRes, targetsRes] = await Promise.all([
      studentsApi.list(),
      templatesApi.list(),
      teachingTargetsApi.list()
    ])

    students.value = studentsRes.data?.data?.list ?? []
    templates.value = templatesRes.data?.data?.list ?? []
    targets.value = targetsRes.data?.data?.list ?? []

    const student = students.value.find((s) => s.id === id)
    if (!student) {
      ElMessage.warning('无权访问该学生或学生不存在')
      router.replace('/assessments')
      return
    }

    studentId.value = id
    studentName.value = student.name
    loadDraft()
    const enabled = templates.value.filter((t) => t.status === 'enabled')
    if (!templateId.value && enabled.length) {
      const firstExcel = enabled.find((t) => t.file_type === 'excel')
      templateId.value = (firstExcel ?? enabled[0]).id
    }
  } finally {
    loading.value = false
  }
}

onMounted(init)
watch(
  () => route.query.student_id,
  (v) => {
    if (!v && studentId.value) router.replace('/assessments')
  }
)
</script>

<style scoped>
.assessment-generate-page .page-header {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.page-title {
  margin: 0;
  font-size: 18px;
}
.top-form {
  margin-bottom: 20px;
}
.main-row {
  min-height: 400px;
}
.cascade-col h4,
.targets-col h4 {
  margin: 0 0 12px;
  font-size: 14px;
}
.cascade-panel {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
}
.cascade-section {
  margin-bottom: 16px;
}
.cascade-section:last-child {
  margin-bottom: 0;
}
.cascade-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}
.cascade-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.target-column {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px;
  max-height: 360px;
  overflow-y: auto;
}
.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.column-title {
  font-weight: 500;
  margin-bottom: 12px;
  color: #303133;
}
.column-header .column-title {
  margin-bottom: 0;
}
.link-option {
  font-weight: normal;
  font-size: 12px;
  color: #606266;
}
.target-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.target-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
}
.target-item:hover {
  background: #f5f7fa;
}
.target-item.checked {
  background: #ecf5ff;
}
.target-num {
  flex-shrink: 0;
  font-weight: 500;
}
.target-content {
  flex: 1;
  font-size: 13px;
  line-height: 1.5;
}
.selected-summary {
  margin: 16px 0;
  font-size: 14px;
  color: #606266;
}
.bottom-actions {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}
.preview-content {
  min-height: 200px;
}
.preview-empty-hint {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  padding: 24px;
  text-align: center;
}
.assessment-html-preview {
  overflow-x: auto;
  max-height: 70vh;
}
.assessment-html-preview :deep(.excel-preview-table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.assessment-html-preview :deep(.excel-preview-table th),
.assessment-html-preview :deep(.excel-preview-table td) {
  border: 1px solid var(--el-border-color);
  padding: 6px 10px;
  text-align: left;
}
.assessment-html-preview :deep(.sheet-block) {
  margin-bottom: 24px;
}
.assessment-html-preview :deep(.sheet-block h4) {
  margin: 0 0 8px;
  font-size: 14px;
}
</style>
