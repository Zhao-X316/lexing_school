import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'

/**
 * API 响应格式
 */
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
}

/**
 * 创建 Axios 实例
 */
const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * 请求拦截器
 */
request.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // FormData 上传时移除 Content-Type，让浏览器自动设置 multipart/form-data; boundary=...
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器
 */
request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
      return response
    }

    const { data } = response
    
    // 如果响应成功，直接返回数据
    if (data.success) {
      return response
    }
    
    // 业务错误
    ElMessage.error(data.message || '请求失败')
    return Promise.reject(new Error(data.message || '请求失败'))
  },
  async (error) => {
    // HTTP 错误处理
    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 401: {
          // 未授权，清除 token 并用路由跳转（保留 SPA 状态、与 router 守卫的 redirect 一致）
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user_info')
          ElMessage.error('登录已过期，请重新登录')
          try {
            const { default: router } = await import('@/router')
            const fullPath = router.currentRoute.value.fullPath
            const redirect =
              fullPath && fullPath !== '/login' && !fullPath.startsWith('/login?') ? fullPath : undefined
            await router.replace({
              path: '/login',
              ...(redirect ? { query: { redirect } } : {})
            })
          } catch {
            window.location.href = '/login'
          }
          break
        }
        case 403:
          ElMessage.error('权限不足，无法访问')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          // blob 响应时，服务端返回的实为 JSON，需解析后展示 message
          if (error.config?.responseType === 'blob' && data instanceof Blob) {
            try {
              const text = await data.text()
              const parsed = JSON.parse(text)
              ElMessage.error(parsed.message || '服务器内部错误')
            } catch {
              ElMessage.error('服务器内部错误')
            }
          } else {
            ElMessage.error((data as { message?: string })?.message || '服务器内部错误')
          }
          break
        default:
          ElMessage.error((data as { message?: string })?.message || '请求失败')
      }
    } else if (error.request) {
      ElMessage.error('网络错误，请检查网络连接')
    } else {
      ElMessage.error(error.message || '请求失败')
    }

    return Promise.reject(error)
  }
)

/**
 * 封装请求方法
 */
export const http = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return request.get(url, config)
  },
  
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return request.post(url, data, config)
  },
  
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return request.put(url, data, config)
  },
  
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return request.delete(url, config)
  }
}

export default request
