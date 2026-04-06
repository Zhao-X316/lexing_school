<template>
  <div class="article-edit-page">
    <div class="page-header">
      <el-button @click="router.back()">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h1 class="page-title">{{ isEdit ? '编辑文章' : '发布文章' }}</h1>
      <div class="header-actions">
        <el-button @click="handleSaveDraft" :loading="saving">保存草稿</el-button>
        <el-button @click="handleSubmitReview" :loading="submittingReview">
          提交审核
        </el-button>
        <el-button v-if="userStore.isAdmin" type="primary" @click="handlePublish" :loading="publishing">
          {{ isEdit ? '更新并发布' : '发布' }}
        </el-button>
      </div>
    </div>
    
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
      class="article-form"
    >
      <div class="form-main">
        <!-- 标题 -->
        <el-form-item label="标题" prop="title">
          <el-input
            v-model="form.title"
            placeholder="请输入文章标题"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        
        <!-- 摘要 -->
        <el-form-item label="摘要" prop="summary">
          <el-input
            v-model="form.summary"
            type="textarea"
            :rows="3"
            placeholder="请输入文章摘要（可选）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        
        <!-- 内容 -->
        <el-form-item label="内容" prop="content">
          <div class="editor-container">
            <Toolbar
              class="toolbar"
              :editor="editorRef"
              :defaultConfig="toolbarConfig"
              mode="default"
            />
            <Editor
              class="editor"
              v-model="form.content"
              :defaultConfig="editorConfig"
              mode="default"
              @onCreated="handleEditorCreated"
            />
          </div>
        </el-form-item>
      </div>
      
      <div class="form-sidebar">
        <!-- 分类 -->
        <el-form-item label="分类" prop="category">
          <el-select v-model="form.category" placeholder="请选择分类">
            <el-option
              v-for="cat in ARTICLE_CATEGORIES"
              :key="cat"
              :label="cat"
              :value="cat"
            />
          </el-select>
        </el-form-item>
        
        <!-- 标签 -->
        <el-form-item label="标签">
          <el-select
            v-model="form.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="输入标签后回车"
          />
        </el-form-item>
        
        <!-- 封面图 -->
        <el-form-item label="封面图">
          <ImageUploader v-model="form.cover_image" placeholder="点击上传封面图" />
          <div class="cover-tip">建议尺寸：800x450px</div>
        </el-form-item>
        
        <!-- 置顶 -->
        <el-form-item label="置顶">
          <el-switch v-model="form.is_featured" />
        </el-form-item>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'
import { articleApi, uploadApi } from '@/api'
import { useUserStore } from '@/stores/user'
import { ARTICLE_CATEGORIES, ArticleStatus, type Article, type ArticleCategory, type ArticleFormData } from '@/types/article'
import ImageUploader from '@/components/common/ImageUploader.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 编辑模式
const articleId = computed(() => route.params.id as string)
const isEdit = computed(() => !!articleId.value)

// 表单引用
const formRef = ref<FormInstance>()

type ArticleEditorForm = Omit<ArticleFormData, 'status'>

// 表单数据
const form = reactive<ArticleEditorForm>({
  title: '',
  summary: '',
  content: '',
  category: ARTICLE_CATEGORIES[0],
  tags: [] as string[],
  cover_image: '',
  is_featured: false
})

// 表单验证规则
const rules: FormRules = {
  title: [
    { required: true, message: '请输入文章标题', trigger: 'blur' },
    { max: 200, message: '标题最多 200 个字符', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入文章内容', trigger: 'blur' }
  ]
}

// 编辑器
const editorRef = shallowRef<IDomEditor>()

const toolbarConfig: Partial<IToolbarConfig> = {
  excludeKeys: ['group-video']
}

// 自定义图片上传函数
async function handleImageUpload(file: File, insertFn: (url: string, alt: string, href: string) => void) {
  try {
    const result = await uploadApi.uploadImage(file)
    insertFn(result.url, file.name, result.url)
  } catch (error) {
    ElMessage.error('图片上传失败')
  }
}

const editorConfig: Partial<IEditorConfig> = {
  placeholder: '请输入文章内容...',
  MENU_CONF: {
    uploadImage: {
      customUpload: handleImageUpload
    }
  }
}

const saving = ref(false)
const publishing = ref(false)
const submittingReview = ref(false)
const loading = ref(false)

/**
 * 编辑器创建完成
 */
function handleEditorCreated(editor: IDomEditor) {
  editorRef.value = editor
}

/**
 * 加载文章详情
 */
async function loadArticle() {
  if (!articleId.value) return
  
  loading.value = true
  
  try {
    const { data } = await articleApi.getArticle(articleId.value)
    
    if (data.data) {
      const article = data.data as Article
      form.title = article.title
      form.summary = article.summary || ''
      form.content = article.content
      form.category = article.category || ARTICLE_CATEGORIES[0]
      form.tags = Array.isArray(article.tags) ? article.tags : []
      form.cover_image = article.cover_image || ''
      form.is_featured = !!article.is_featured
    }
  } catch (error) {
    console.error('加载文章失败:', error)
    ElMessage.error('加载文章失败')
    router.back()
  } finally {
    loading.value = false
  }
}

function buildPayload(status: ArticleStatus): ArticleFormData {
  return {
    title: form.title,
    summary: form.summary || undefined,
    content: form.content,
    category: form.category as ArticleCategory,
    tags: form.tags,
    cover_image: form.cover_image || undefined,
    is_featured: form.is_featured,
    status
  }
}

/**
 * 保存草稿
 */
async function handleSaveDraft() {
  if (!form.title) {
    ElMessage.warning('请输入文章标题')
    return
  }
  
  saving.value = true
  
  try {
    if (isEdit.value) {
      await articleApi.updateArticle(articleId.value, buildPayload(ArticleStatus.DRAFT))
    } else {
      await articleApi.createArticle(buildPayload(ArticleStatus.DRAFT))
    }
    
    ElMessage.success('草稿已保存')
    router.push('/articles')
  } catch (error) {
    console.error('保存草稿失败:', error)
  } finally {
    saving.value = false
  }
}

/** 提交审核（教师/管理员均可，状态→待审核） */
async function handleSubmitReview() {
  if (!form.title) {
    ElMessage.warning('请输入文章标题')
    return
  }
  submittingReview.value = true
  try {
    const payload = buildPayload(ArticleStatus.PENDING_REVIEW)
    if (isEdit.value) {
      await articleApi.updateArticle(articleId.value, payload)
      ElMessage.success('已提交审核')
    } else {
      await articleApi.createArticle(payload)
      ElMessage.success('已提交审核')
    }
    router.push('/articles')
  } catch (e) {
    if ((e as Error)?.message) ElMessage.error((e as Error).message)
  } finally {
    submittingReview.value = false
  }
}

/** 直接发布（仅管理员） */
async function handlePublish() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    ElMessage.warning('请完善文章信息')
    return
  }
  publishing.value = true
  try {
    const payload = buildPayload(ArticleStatus.PUBLISHED)
    if (isEdit.value) {
      await articleApi.updateArticle(articleId.value, payload)
      ElMessage.success('文章已更新并发布')
    } else {
      await articleApi.createArticle(payload)
      ElMessage.success('文章已发布')
    }
    router.push('/articles')
  } catch (e) {
    if ((e as Error)?.message) ElMessage.error((e as Error).message)
  } finally {
    publishing.value = false
  }
}

// 初始化
onMounted(() => {
  if (isEdit.value) {
    loadArticle()
  }
})

// 销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor) {
    editor.destroy()
  }
})
</script>

<style src="@wangeditor/editor/dist/css/style.css"></style>

<style scoped>
.article-edit-page {
  max-width: 1400px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.page-title {
  flex: 1;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.article-form {
  display: flex;
  gap: 24px;
}

.form-main {
  flex: 1;
  min-width: 0;
}

.form-sidebar {
  width: 320px;
  flex-shrink: 0;
}

/* 编辑器 */
.editor-container {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.toolbar {
  border-bottom: 1px solid #dcdfe6;
}

.editor {
  height: 500px;
  overflow-y: auto;
}

.cover-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

@media (max-width: 1024px) {
  .article-form {
    flex-direction: column;
  }
  
  .form-sidebar {
    width: 100%;
  }
}
</style>
