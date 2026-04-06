/**
 * 用户角色枚举
 */
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  TEACHER = 'teacher',
  PARENT = 'parent'
}

/**
 * 用户角色名称映射
 */
export const ROLE_NAMES: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: '超级管理员',
  [UserRole.ADMIN]: '管理员',
  [UserRole.TEACHER]: '教师',
  [UserRole.PARENT]: '家长'
}

/**
 * 用户状态枚举（与 §6.2 users 表 status 一致：active | frozen）
 */
export enum UserStatus {
  ACTIVE = 'active',
  FROZEN = 'frozen'
}

/**
 * 用户状态名称映射
 */
export const STATUS_NAMES: Record<UserStatus, string> = {
  [UserStatus.ACTIVE]: '正常',
  [UserStatus.FROZEN]: '冻结'
}

/**
 * 用户信息接口（与 §6.2 users 表一致：id, username, role, status, created_at）
 */
export interface User {
  id: string
  username: string
  role: UserRole
  status: UserStatus
  created_at: string
  /** 兼容旧字段，后端不返回 */
  real_name?: string
  email?: string
  phone?: string
  last_login_at?: string
}

/**
 * 登录请求参数
 */
export interface LoginParams {
  username: string
  password: string
}

/**
 * 登录响应数据
 */
export interface LoginResponse {
  user: User
  token: string
}

/**
 * 注册/创建账号请求参数（创建时仅 username、password、role 必填）
 */
export interface RegisterParams {
  username: string
  password: string
  role: UserRole
  real_name?: string
  email?: string
  phone?: string
}

/**
 * 用户列表查询参数
 */
export interface UserQueryParams {
  page?: number
  limit?: number
  role?: UserRole
  status?: UserStatus
  search?: string
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  list: T[]
  total: number
  page: number
  limit: number
}

/**
 * API 响应格式
 */
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
}
