import { http } from './request'
import type { ApiResponse } from './request'

export interface UploadResult {
  key: string
  url: string
  filename: string
  size: number
  mimetype: string
  media_id?: string
}

/**
 * 上传 API
 */
export const uploadApi = {
  /**
   * 上传文件
   */
  async uploadFile(file: File): Promise<UploadResult> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: formData
    })
    
    const data: ApiResponse<UploadResult> = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || '上传失败')
    }
    
    return data.data!
  },
  
  /**
   * 上传图片
   */
  async uploadImage(file: File): Promise<UploadResult> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch('/api/upload/image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: formData
    })
    
    const data: ApiResponse<UploadResult> = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || '上传失败')
    }
    
    return data.data!
  },
  
  /**
   * 获取文件列表
   */
  getFiles(params?: { prefix?: string; limit?: number }) {
    return http.get<{ files: string[]; isTruncated: boolean }>('/upload/files', { params })
  },
  
  /**
   * 获取文件访问 URL
   */
  getFileUrl(key: string, expire?: number) {
    return http.get<{ url: string }>(`/upload/url/${encodeURIComponent(key)}`, {
      params: { expire }
    })
  },
  
  /**
   * 删除文件
   */
  deleteFile(key: string) {
    return http.delete<void>(`/upload/${encodeURIComponent(key)}`)
  }
}
