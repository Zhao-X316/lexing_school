/**
 * 文章状态枚举（§12.2.2 审核流程：draft / pending_review / published / rejected）
 */
export enum ArticleStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  PUBLISHED = 'published',
  REJECTED = 'rejected'
}

/**
 * 文章状态名称映射
 */
export const ARTICLE_STATUS_NAMES: Record<ArticleStatus, string> = {
  [ArticleStatus.DRAFT]: '草稿',
  [ArticleStatus.PENDING_REVIEW]: '待审核',
  [ArticleStatus.PUBLISHED]: '已发布',
  [ArticleStatus.REJECTED]: '已驳回'
}

/**
 * 文章分类
 */
export const ARTICLE_CATEGORIES = [
  '新闻动态',
  '教学活动',
  '校园风采',
  '家校互动',
  '招生信息'
] as const

export type ArticleCategory = typeof ARTICLE_CATEGORIES[number]

/**
 * 文章接口
 */
export interface Article {
  id: string
  title: string
  slug?: string
  summary?: string
  content: string
  cover_image?: string
  category: ArticleCategory
  tags?: string[]
  status: ArticleStatus
  view_count: number
  is_featured: boolean
  published_at?: string
  created_at: string
  updated_at: string
  author?: {
    id: string
    real_name: string
    username: string
  }
}

/**
 * 文章列表查询参数
 */
export interface ArticleQueryParams {
  page?: number
  limit?: number
  status?: ArticleStatus
  category?: ArticleCategory
  search?: string
  is_featured?: boolean
}

export interface PaginatedResponse<T> {
  list: T[]
  total: number
  page: number
  limit: number
}

/**
 * 创建/更新文章参数
 */
export interface ArticleFormData {
  title: string
  slug?: string
  summary?: string
  content: string
  cover_image?: string
  category: ArticleCategory
  tags?: string[]
  status: ArticleStatus
  is_featured: boolean
}
