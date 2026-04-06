import { http } from './request'

export interface Student {
  id: number
  name: string
  parent_id?: number
  teacher_id?: number
  total_hours: number
  used_hours: number
  remaining_hours: number
  created_at?: string
}

export interface RadarChartData {
  indicator: { name: string; max: number }[]
  values: number[]
}

export interface TrendChartData {
  dates: string[]
  scores: number[]
  list: { assessment_id: number; assessment_date: string; score: number }[]
}

export const studentsApi = {
  list: () => http.get<{ list: Student[] }>('/students'),
  getById: (id: number) => http.get<Student>(`/students/${id}`),
  create: (data: { name: string; teacher_id?: number | null; parent_id?: number | null; total_hours?: number }) =>
    http.post<Student>('/students', data),
  update: (id: number, data: { name?: string; teacher_id?: number | null; parent_id?: number | null; total_hours?: number }) =>
    http.put<Student>(`/students/${id}`, data),
  getRadarChart: (id: number, assessmentId?: number) =>
    http.get<RadarChartData>(`/students/${id}/charts/radar`, {
      params: assessmentId ? { assessment_id: assessmentId } : undefined
    }),
  getTrendChart: (id: number) => http.get<TrendChartData>(`/students/${id}/charts/trend`)
}
