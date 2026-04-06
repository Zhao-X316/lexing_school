import { http } from './request'
import type { LoginParams, LoginResponse, RegisterParams, User } from '@/types/user'

/**
 * 认证相关 API
 */
export const authApi = {
  /**
   * 用户登录
   */
  login(params: LoginParams) {
    return http.post<LoginResponse>('/auth/login', params)
  },
  
  /**
   * 用户注册（创建新用户）
   */
  register(params: RegisterParams) {
    return http.post<User>('/auth/register', params)
  },
  
  /**
   * 获取当前用户信息
   */
  getCurrentUser() {
    return http.get<User>('/auth/me')
  },
  
  /**
   * 修改密码
   */
  changePassword(userId: string, data: { old_password: string; new_password: string }) {
    return http.put<void>(`/users/${userId}/password`, data)
  }
}
