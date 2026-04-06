<template>
  <div class="articles-page">
    <div class="page-header">
      <h1 class="page-title">内容管理</h1>
      <el-button type="primary" @click="router.push('/articles/create')">
        <el-icon><Plus /></el-icon>
        {{ userStore.isAdmin ? '发布文章' : '新建文章' }}
      </el-button>
    </div>
    
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 120px" @change="handleSearch">
            <el-option label="草稿" value="draft" />
            <el-option label="待审核" value="pending_review" />
            <el-option label="已发布" value="published" />
            <el-option label="已驳回" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <el-card class="table-card" shadow="never">
      <el-table v-loading="loading" :data="articleList" stripe style="width: 100%">
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ ARTICLE_STATUS_NAMES[row.status as ArticleStatus] ?? row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <template v-if="row.status === 'draft'">
              <el-button link type="warning" @click="handleSubmitReview(row)">提交审核</el-button>
              <template v-if="userStore.isAdmin">
                <el-button link type="success" @click="handlePublish(row)">直接发布</el-button>
              </template>
            </template>
            <template v-else-if="row.status === 'pending_review' && userStore.isAdmin">
              <el-button link type="success" @click="handleApprove(row)">通过</el-button>
              <el-button link type="danger" @click="handleReject(row)">驳回</el-button>
            </template>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.limit"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadArticles"
          @current-change="loadArticles"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { articleApi } from '@/api'
import { useUserStore } from '@/stores/user'
import { ARTICLE_STATUS_NAMES, ArticleStatus, type Article, type ArticleQueryParams } from '@/types/article'

const router = useRouter()
const userStore = useUserStore()

type ArticlePageQuery = Omit<ArticleQueryParams, 'status'> & {
  status?: ArticleStatus
}

const queryParams = reactive<ArticlePageQuery>({
  page: 1,
  limit: 10,
  status: undefined
})

// 文章列表
const articleList = ref<Article[]>([])
const total = ref(0)
const loading = ref(false)

/**
 * 加载文章列表
 */
async function loadArticles() {
  loading.value = true
  
  try {
    const { data } = await articleApi.getArticles({
      page: queryParams.page,
      limit: queryParams.limit,
      status: queryParams.status
    })
    
    if (data.data) {
      articleList.value = data.data.list
      total.value = data.data.total
    }
  } catch (error) {
    console.error('加载文章列表失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 搜索
 */
function handleSearch() {
  queryParams.page = 1
  loadArticles()
}

/**
 * 重置
 */
function handleReset() {
  queryParams.status = undefined
  handleSearch()
}

/**
 * 编辑文章
 */
function handleEdit(article: Article) {
  router.push(`/articles/${article.id}/edit`)
}

/** 提交审核（教师：草稿→待审核） */
async function handleSubmitReview(article: Article) {
  try {
    await ElMessageBox.confirm('确定提交审核？提交后由管理员通过或驳回。', '提交审核', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    await articleApi.updateArticle(String(article.id), { status: ArticleStatus.PENDING_REVIEW })
    ElMessage.success('已提交审核')
    loadArticles()
  } catch (e) {
    if (e !== 'cancel') {}
  }
}

/** 直接发布（仅管理员，草稿→已发布） */
async function handlePublish(article: Article) {
  try {
    await ElMessageBox.confirm('确定直接发布这篇文章吗？', '发布确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    await articleApi.updateArticle(String(article.id), { status: ArticleStatus.PUBLISHED })
    ElMessage.success('发布成功')
    loadArticles()
  } catch (e) {
    if (e !== 'cancel') {}
  }
}

/** 审核通过（仅管理员） */
async function handleApprove(article: Article) {
  try {
    await articleApi.approve(String(article.id))
    ElMessage.success('已通过并发布')
    loadArticles()
  } catch {}
}

/** 审核驳回（仅管理员） */
async function handleReject(article: Article) {
  try {
    await ElMessageBox.confirm('确定驳回该文章？作者可修改后重新提交审核。', '驳回确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await articleApi.reject(String(article.id))
    ElMessage.success('已驳回')
    loadArticles()
  } catch (e) {
    if (e !== 'cancel') {}
  }
}

async function handleDelete(article: Article) {
  try {
    await ElMessageBox.confirm(
      `确定要删除文章 "${article.title}" 吗？此操作不可恢复。`,
      '删除确认',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
    )
    await articleApi.deleteArticle(String(article.id))
    ElMessage.success('删除成功')
    loadArticles()
  } catch (e) {
    if (e !== 'cancel') {}
  }
}

/**
 * 获取状态标签类型
 */
function getStatusTagType(status: string) {
  const types: Record<string, string> = {
    draft: 'info',
    pending_review: 'warning',
    published: 'success',
    rejected: 'danger'
  }
  return types[status] || 'info'
}

/**
 * 格式化日期
 */
function formatDate(dateStr?: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 初始化
onMounted(() => {
  loadArticles()
})
</script>

<style scoped>
.articles-page {
  max-width: 1400px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.filter-card {
  margin-bottom: 16px;
}

.table-card {
  margin-bottom: 16px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.article-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.featured-tag {
  flex-shrink: 0;
}
</style>
