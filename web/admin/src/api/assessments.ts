import request, { http } from './request'

export interface Assessment {
  id: number
  student_id: number
  teacher_id: number
  assessment_date: string
  status: 'active' | 'void'
  created_at: string
  student_name?: string
}

export interface AssessmentsListResponse {
  list: Assessment[]
  total_count?: number
  latest_date?: string
}

export const assessmentsApi = {
  list: (studentId?: number, status?: 'active' | 'void' | 'all') => {
    const params: Record<string, number | string> = {}
    if (studentId) params.student_id = studentId
    if (status && status !== 'active') params.status = status
    return http.get<AssessmentsListResponse>('/assessments', { params: Object.keys(params).length ? params : undefined })
  },
  generate: (data: { student_id: number; target_ids: number[]; template_id?: number }) =>
    request.post<Blob>('/assessments/generate', data, { responseType: 'blob' }),
  preview: (data: { student_id: number; target_ids: number[]; template_id?: number }) =>
    http.post<{ type: string; html: string }>('/assessments/preview', data),
  void: (id: number) => http.put(`/assessments/${id}/void`),
  remove: (id: number) => http.delete(`/assessments/${id}`)
}
