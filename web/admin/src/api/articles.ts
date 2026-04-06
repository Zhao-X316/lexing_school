import { http } from './request'
import type { Article, ArticleQueryParams, ArticleFormData, PaginatedResponse } from '@/types/article'

/**
 * 文章管理 API
 */
export const articleApi = {
  /**
   * 获取文章列表
   */
  getArticles(params?: ArticleQueryParams) {
    return http.get<PaginatedResponse<Article>>('/articles', { params })
  },
  
  /**
   * 获取单篇文章
   */
  getArticle(id: string) {
    return http.get<Article>(`/articles/${id}`)
  },
  
  /**
   * 创建文章
   */
  createArticle(data: ArticleFormData) {
    return http.post<Article>('/articles', data)
  },
  
  /**
   * 更新文章
   */
  updateArticle(id: string, data: Partial<ArticleFormData>) {
    return http.put<Article>(`/articles/${id}`, data)
  },
  
  /**
   * 删除文章
   */
  deleteArticle(id: string) {
    return http.delete<void>(`/articles/${id}`)
  },

  /**
   * 审核通过（§12.2.2，仅管理员）
   */
  approve(id: string) {
    return http.put<Article>(`/articles/${id}/approve`)
  },

  /**
   * 审核驳回（§12.2.2，仅管理员）
   */
  reject(id: string) {
    return http.put<Article>(`/articles/${id}/reject`)
  },
  
  /**
   * 获取文章统计
   */
  getStats() {
    return http.get<{ byCategory: Record<string, number>; byStatus: Record<string, number> }>('/articles/stats')
  }
}
