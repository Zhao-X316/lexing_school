import { http } from './request'
import type { User, UserQueryParams, PaginatedResponse } from '@/types/user'

/**
 * 用户管理 API（§5.2：/api/users/list、/api/users/create）
 */
export const userApi = {
  /**
   * 获取用户列表（支持 role、status、search、page、limit）
   */
  getUsers(params?: UserQueryParams) {
    return http.get<PaginatedResponse<User>>('/users', { params })
  },

  /**
   * 创建账号 - POST /api/users/create（超管、管理员）
   */
  createUser(data: { username: string; password: string; role: string }) {
    return http.post<User>('/users/create', data)
  },
  
  /**
   * 获取单个用户信息
   */
  getUser(id: string) {
    return http.get<User>(`/users/${id}`)
  },
  
  /**
   * 更新用户信息
   */
  updateUser(id: string, data: Partial<User>) {
    return http.put<User>(`/users/${id}`, data)
  },
  
  /**
   * 删除用户
   */
  deleteUser(id: string) {
    return http.delete<void>(`/users/${id}`)
  },
  
  /**
   * 修改密码
   */
  changePassword(id: string, data: { old_password?: string; new_password: string }) {
    return http.put<void>(`/users/${id}/password`, data)
  }
}
