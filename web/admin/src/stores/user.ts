import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'
import type { User, LoginParams, RegisterParams } from '@/types/user'
import { UserRole, UserStatus } from '@/types/user'

function isValidPersistedUser(raw: unknown): raw is User {
  if (!raw || typeof raw !== 'object') return false
  const o = raw as Record<string, unknown>
  if (o.id == null || o.username == null || typeof o.username !== 'string' || !o.username.trim()) {
    return false
  }
  if (!Object.values(UserRole).includes(o.role as UserRole)) return false
  if (o.status == null || !Object.values(UserStatus).includes(o.status as UserStatus)) return false
  return true
}

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  
  // 计算属性
  const isLoggedIn = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role || null)
  const userName = computed(() => user.value?.real_name || user.value?.username || '未知用户')
  
  // 权限判断
  const isSuperAdmin = computed(() => user.value?.role === UserRole.SUPER_ADMIN)
  const isAdmin = computed(() => 
    user.value?.role === UserRole.SUPER_ADMIN || user.value?.role === UserRole.ADMIN
  )
  const isTeacher = computed(() => 
    user.value?.role === UserRole.TEACHER || isAdmin.value
  )
  const isParent = computed(() => user.value?.role === UserRole.PARENT)

  /**
   * 登录
   */
  async function login(params: LoginParams) {
    const { data } = await authApi.login(params)
    
    if (data.data) {
      token.value = data.data.token
      user.value = data.data.user
      
      // 持久化存储
      localStorage.setItem('auth_token', data.data.token)
      localStorage.setItem('user_info', JSON.stringify(data.data.user))
      
      return data.data
    }
    
    throw new Error('登录失败')
  }
  
  /**
   * 登出
   */
  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_info')
  }
  
  /**
   * 注册新用户（创建账号）
   */
  async function register(params: RegisterParams) {
    const { data } = await authApi.register(params)
    return data.data
  }
  
  /**
   * 获取当前用户信息
   */
  async function fetchCurrentUser() {
    const { data } = await authApi.getCurrentUser()
    
    if (data.data) {
      user.value = data.data
      localStorage.setItem('user_info', JSON.stringify(data.data))
    }
    
    return data.data
  }
  
  /**
   * 从本地存储恢复登录状态
   */
  function restoreFromStorage() {
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('user_info')
    
    if (savedToken && savedUser) {
      try {
        const parsed: unknown = JSON.parse(savedUser)
        if (!isValidPersistedUser(parsed)) {
          logout()
          return
        }
        token.value = savedToken
        user.value = parsed
      } catch {
        logout()
      }
    }
  }
  
  /**
   * 更新用户信息
   */
  function updateUserInfo(info: Partial<User>) {
    if (user.value) {
      user.value = { ...user.value, ...info }
      localStorage.setItem('user_info', JSON.stringify(user.value))
    }
  }
  
  return {
    // 状态
    user,
    token,
    
    // 计算属性
    isLoggedIn,
    userRole,
    userName,
    isSuperAdmin,
    isAdmin,
    isTeacher,
    isParent,

    // 方法
    login,
    logout,
    register,
    fetchCurrentUser,
    restoreFromStorage,
    updateUserInfo
  }
})
