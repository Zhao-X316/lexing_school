<template>
  <div class="students-page">
    <div class="page-header">
      <h1 class="page-title">学生管理</h1>
      <el-button v-if="userStore.isAdmin" type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        新增学生
      </el-button>
    </div>
    <el-card shadow="never">
      <el-table v-loading="loading" :data="list" stripe>
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column label="负责教师" width="140">
          <template #default="{ row }">
            {{ teacherName(row.teacher_id) || '—' }}
          </template>
        </el-table-column>
        <el-table-column label="关联家长" width="140">
          <template #default="{ row }">
            {{ parentName(row.parent_id) || '—' }}
          </template>
        </el-table-column>
        <el-table-column prop="total_hours" label="总课时" width="90" />
        <el-table-column prop="used_hours" label="已用" width="80" />
        <el-table-column prop="remaining_hours" label="剩余" width="80" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button v-if="userStore.isAdmin" link type="primary" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button link type="primary" @click="goProfile(row.id)">档案与图表</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editingStudent ? '编辑学生' : '新增学生'" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="学生姓名" />
        </el-form-item>
        <el-form-item label="负责教师" prop="teacher_id">
          <el-select v-model="form.teacher_id" placeholder="请选择教师" clearable filterable style="width: 100%">
            <el-option
              v-for="u in teachers"
              :key="u.id"
              :label="u.username"
              :value="Number(u.id)"
            />
            <template #empty>
              <div class="select-empty-tip">暂无教师，请先在「账号管理」中创建教师账号</div>
            </template>
          </el-select>
        </el-form-item>
        <el-form-item label="关联家长" prop="parent_id">
          <el-select v-model="form.parent_id" placeholder="请选择家长" clearable filterable style="width: 100%">
            <el-option
              v-for="u in parents"
              :key="u.id"
              :label="u.username"
              :value="Number(u.id)"
            />
            <template #empty>
              <div class="select-empty-tip">暂无家长，请先在「账号管理」中创建家长账号</div>
            </template>
          </el-select>
        </el-form-item>
        <el-form-item label="总课时" prop="total_hours">
          <el-input-number v-model="form.total_hours" :min="0" :max="9999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { studentsApi, type Student } from '@/api/students'
import { userApi } from '@/api'
import { useUserStore } from '@/stores/user'
import { UserRole, type User } from '@/types/user'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const list = ref<Student[]>([])
const teachers = ref<User[]>([])
const parents = ref<User[]>([])
const dialogVisible = ref(false)
const editingStudent = ref<Student | null>(null)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({
  name: '',
  teacher_id: null as number | null,
  parent_id: null as number | null,
  total_hours: 0
})
const rules: FormRules = {
  name: [{ required: true, message: '请输入学生姓名', trigger: 'blur' }]
}

const teacherName = computed(() => (id: number | null | undefined) => {
  if (id == null) return ''
  return teachers.value.find((u) => Number(u.id) === Number(id))?.username ?? String(id)
})
const parentName = computed(() => (id: number | null | undefined) => {
  if (id == null) return ''
  return parents.value.find((u) => Number(u.id) === Number(id))?.username ?? String(id)
})

async function loadList() {
  loading.value = true
  try {
    const { data } = await studentsApi.list()
    list.value = data?.data?.list ?? []
  } finally {
    loading.value = false
  }
}

async function loadTeachersAndParents() {
  if (!userStore.isAdmin) return
  try {
    const [tRes, pRes] = await Promise.all([
      userApi.getUsers({ role: UserRole.TEACHER, limit: 200 }),
      userApi.getUsers({ role: UserRole.PARENT, limit: 200 })
    ])
    teachers.value = tRes.data?.data?.list ?? []
    parents.value = pRes.data?.data?.list ?? []
  } catch {
    teachers.value = []
    parents.value = []
  }
}

async function handleCreate() {
  editingStudent.value = null
  form.name = ''
  form.teacher_id = null
  form.parent_id = null
  form.total_hours = 0
  await loadTeachersAndParents()
  dialogVisible.value = true
}

async function handleEdit(row: Student) {
  editingStudent.value = row
  form.name = row.name
  form.teacher_id = row.teacher_id ?? null
  form.parent_id = row.parent_id ?? null
  form.total_hours = row.total_hours ?? 0
  await loadTeachersAndParents()
  dialogVisible.value = true
}

async function handleSubmit() {
  await formRef.value?.validate().catch(() => {})
  submitting.value = true
  try {
    if (editingStudent.value) {
      await studentsApi.update(editingStudent.value.id, {
        name: form.name,
        teacher_id: form.teacher_id,
        parent_id: form.parent_id,
        total_hours: form.total_hours
      })
      ElMessage.success('更新成功')
    } else {
      await studentsApi.create({
        name: form.name,
        teacher_id: form.teacher_id,
        parent_id: form.parent_id,
        total_hours: form.total_hours
      })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadList()
  } catch {
    // error handled by interceptor
  } finally {
    submitting.value = false
  }
}

function goProfile(id: number) {
  router.push({ name: 'StudentProfile', params: { id: String(id) } })
}

onMounted(() => {
  loadList()
  loadTeachersAndParents()
})
</script>

<style scoped>
.students-page .page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.page-title { margin: 0; font-size: 20px; }
.select-empty-tip {
  padding: 8px 12px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
