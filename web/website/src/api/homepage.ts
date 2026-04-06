/**
 * 首页配置 API - GET /api/homepage/config
 */

import type { HomepageConfigMap } from '@/types/homepage'

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

export async function getHomepageConfig(): Promise<HomepageConfigMap> {
  const res = await fetch(`${API_BASE}/homepage/config`)
  if (!res.ok) {
    throw new Error(`获取首页配置失败: ${res.status}`)
  }
  const json = await res.json()
  if (!json.success || !json.data) {
    throw new Error('首页配置数据格式异常')
  }
  return json.data
}
