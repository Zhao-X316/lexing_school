import request, { http } from './request'

export interface Template {
  id: number
  name: string
  file_path: string
  file_type: 'excel' | 'word'
  scenario?: string
  status: 'enabled' | 'disabled'
  created_at?: string
}

export const templatesApi = {
  list: () => http.get<{ list: Template[] }>('/templates'),
  getById: (id: number) => http.get<Template>(`/templates/${id}`),
  preview: (id: number) =>
    request.get<Blob>(`/templates/${id}/preview`, { responseType: 'blob' }),
  previewHtml: (id: number) =>
    http.get<{ name: string; sheets: Array<{ name: string; html: string }> }>(`/templates/${id}/preview-html`),
  previewMarkdown: (id: number) =>
    http.get<{ name: string; sheets: Array<{ name: string; markdown: string }> }>(`/templates/${id}/preview-markdown`),
  download: (id: number) =>
    request.get<Blob>(`/templates/${id}/download`, { responseType: 'blob' }),
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    // 传递 UTF-8 文件名，避免 multer 解析 Content-Disposition 时乱码
    const baseName = file.name.replace(/\.[^/.]+$/, '')
    form.append('name', baseName || file.name)
    return http.post<Template>('/templates/upload', form)
  },
  update: (id: number, data: Partial<Pick<Template, 'name' | 'scenario' | 'status'>>) =>
    http.put<Template>(`/templates/${id}`, data),
  remove: (id: number) => http.delete(`/templates/${id}`)
}
