import { http } from './request'

export interface TeachingTarget {
  id: number
  major_category: string
  sub_category: string
  stage: number
  target_type: 'long_term' | 'short_term'
  content: string
  target_number?: string
  created_at?: string
}

export interface TeachingTargetListParams {
  page?: number
  limit?: number
  major_category?: string
  sub_category?: string
  stage?: number
  target_type?: string
  content?: string
}

export interface TeachingTargetListResponse {
  list: TeachingTarget[]
  total: number
  page: number
  limit: number
}

export const teachingTargetsApi = {
  list: (params?: TeachingTargetListParams) =>
    http.get<TeachingTargetListResponse>('/teaching-targets', { params }),
  clear: () => http.delete<{ message: string }>('/teaching-targets/clear'),
  getById: (id: number) => http.get<TeachingTarget>(`/teaching-targets/${id}`),
  create: (data: Omit<TeachingTarget, 'id' | 'created_at'>) =>
    http.post<TeachingTarget>('/teaching-targets', data),
  update: (id: number, data: Partial<Omit<TeachingTarget, 'id'>>) =>
    http.put<TeachingTarget>(`/teaching-targets/${id}`, data),
  remove: (id: number) => http.delete(`/teaching-targets/${id}`),
  importExcel: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return http.post<{ count: number }>('/teaching-targets/import', form, {
      timeout: 120000
    })
  }
}
