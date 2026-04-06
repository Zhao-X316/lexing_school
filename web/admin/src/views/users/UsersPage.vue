<template>
  <div class="users-page">
    <div class="page-header">
      <h1 class="page-title">账号管理</h1>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        新增账号
      </el-button>
    </div>
    
    <!-- 搜索和筛选 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.search"
            placeholder="用户名/姓名"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        
        <el-form-item label="角色">
          <el-select v-model="queryParams.role" placeholder="全部角色" clearable>
            <el-option label="超级管理员" value="super_admin" />
            <el-option label="管理员" value="admin" />
            <el-option label="教师" value="teacher" />
            <el-option label="家长" value="parent" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="全部状态" clearable>
            <el-option label="正常" value="active" />
            <el-option label="冻结" value="frozen" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 用户列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="userList"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="username" label="用户名" width="160" />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.role)">
              {{ ROLE_NAMES[row.role as UserRole] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ STATUS_NAMES[row.status as UserStatus] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button link type="warning" @click="handleResetPassword(row)">
              重置密码
            </el-button>
            <el-button
              link
              type="danger"
              @click="handleDelete(row)"
              :disabled="row.id === userStore.user?.id"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.limit"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadUsers"
          @current-change="loadUsers"
        />
      </div>
    </el-card>
    
    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingUser ? '编辑账号' : '新增账号'"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            :disabled="!!editingUser"
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password" v-if="!editingUser">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码（至少6位）"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="请选择角色">
            <el-option
              v-if="userStore.isSuperAdmin"
              label="超级管理员"
              value="super_admin"
            />
            <el-option label="管理员" value="admin" />
            <el-option label="教师" value="teacher" />
            <el-option label="家长" value="parent" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="状态" prop="status" v-if="editingUser">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option label="正常" value="active" />
            <el-option label="冻结" value="frozen" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { userApi } from '@/api'
import { useUserStore } from '@/stores/user'
import { ROLE_NAMES, STATUS_NAMES, UserRole, UserStatus, type User, type UserQueryParams } from '@/types/user'

const userStore = useUserStore()

// 查询参数
type UserPageQuery = Omit<UserQueryParams, 'role' | 'status'> & {
  role?: UserRole
  status?: UserStatus
}

const queryParams = reactive<UserPageQuery>({
  page: 1,
  limit: 10,
  search: '',
  role: undefined,
  status: undefined
})

// 用户列表
const userList = ref<User[]>([])
const total = ref(0)
const loading = ref(false)

// 对话框
const dialogVisible = ref(false)
const editingUser = ref<User | null>(null)
const submitting = ref(false)
const formRef = ref<FormInstance>()

// 表单数据（与 §6.2 users 表一致）
const form = reactive({
  username: '',
  password: '',
  role: 'parent' as UserRole,
  status: 'active' as UserStatus
})

// 表单验证规则（编辑时不需要密码）
const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 50, message: '用户名长度 2-50 个字符', trigger: 'blur' }
  ],
  password: [
    {
      validator: (_rule: unknown, value: string, callback: (err?: Error) => void) => {
        if (editingUser.value) return callback()
        if (!value || value.length < 6) return callback(new Error('密码至少 6 个字符'))
        callback()
      },
      trigger: 'blur'
    }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

/**
 * 加载用户列表
 */
async function loadUsers() {
  loading.value = true
  
  try {
    const { data } = await userApi.getUsers({
      page: queryParams.page,
      limit: queryParams.limit,
      search: queryParams.search || undefined,
      role: queryParams.role,
      status: queryParams.status
    })
    
    if (data?.data) {
      userList.value = data.data.list ?? []
      total.value = data.data.total ?? 0
    }
  } catch (error) {
    console.error('加载用户列表失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 搜索
 */
function handleSearch() {
  queryParams.page = 1
  loadUsers()
}

/**
 * 重置
 */
function handleReset() {
  queryParams.search = ''
  queryParams.role = undefined
  queryParams.status = undefined
  handleSearch()
}

/**
 * 新增用户
 */
function handleCreate() {
  editingUser.value = null
  Object.assign(form, {
    username: '',
    password: '',
    role: UserRole.PARENT,
    status: UserStatus.ACTIVE
  })
  dialogVisible.value = true
}

/**
 * 编辑用户
 */
function handleEdit(user: User) {
  editingUser.value = user
  Object.assign(form, {
    username: user.username,
    password: '',
    role: user.role,
    status: user.status
  })
  dialogVisible.value = true
}

/**
 * 提交表单
 */
async function handleSubmit() {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  
  submitting.value = true
  
  try {
    if (editingUser.value) {
      await userApi.updateUser(editingUser.value.id, {
        role: form.role,
        status: form.status
      })
      ElMessage.success('更新成功')
    } else {
      await userApi.createUser({
        username: form.username,
        password: form.password,
        role: form.role
      })
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    loadUsers()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitting.value = false
  }
}

/**
 * 重置密码
 */
async function handleResetPassword(user: User) {
  try {
    const { value } = await ElMessageBox.prompt('请输入新密码', '重置密码', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^.{6,}$/,
      inputErrorMessage: '密码至少 6 个字符'
    })
    
    await userApi.changePassword(user.id, { old_password: '', new_password: value })
    ElMessage.success('密码已重置')
  } catch {
    // 用户取消
  }
}

/**
 * 删除用户
 */
async function handleDelete(user: User) {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.username}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await userApi.deleteUser(user.id)
    ElMessage.success('删除成功')
    loadUsers()
  } catch {
    // 用户取消
  }
}

/**
 * 获取角色标签类型
 */
function getRoleTagType(role: string) {
  const types: Record<string, string> = {
    super_admin: 'danger',
    admin: 'warning',
    teacher: 'success',
    parent: 'info'
  }
  return types[role] || 'info'
}

/**
 * 获取状态标签类型
 */
function getStatusTagType(status: string) {
  const types: Record<string, string> = {
    active: 'success',
    frozen: 'warning'
  }
  return types[status] || 'info'
}

/**
 * 格式化日期
 */
function formatDate(dateStr?: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 初始化
onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.users-page {
  max-width: 1400px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.filter-card {
  margin-bottom: 16px;
}

.table-card {
  margin-bottom: 16px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
