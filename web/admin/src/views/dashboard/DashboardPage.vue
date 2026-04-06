<template>
  <div class="dashboard-page">
    <h1 class="page-title">仪表盘</h1>
    
    <!-- 欢迎卡片 -->
    <el-card class="welcome-card" shadow="never">
      <div class="welcome-content">
        <div class="welcome-text">
          <h2>欢迎回来，{{ userStore.userName }}！</h2>
          <p>今天是 {{ currentDate }}，祝您工作愉快！</p>
        </div>
        <div class="welcome-icon">👋</div>
      </div>
    </el-card>
    
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon users">👥</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.userCount }}</div>
            <div class="stat-label">用户总数</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon articles">📄</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.articleCount }}</div>
            <div class="stat-label">文章总数</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon published">✅</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.publishedCount }}</div>
            <div class="stat-label">已发布</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon views">👁️</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalViews }}</div>
            <div class="stat-label">总浏览量</div>
          </div>
        </div>
      </el-card>
    </div>
    
    <!-- 快捷操作 -->
    <el-card class="quick-actions" shadow="never">
      <template #header>
        <span class="card-title">快捷操作</span>
      </template>
      <div class="actions-grid">
        <el-button type="primary" @click="router.push('/articles/create')" v-if="userStore.isTeacher">
          <el-icon><Plus /></el-icon>
          发布文章
        </el-button>
        <el-button @click="router.push('/users')" v-if="userStore.isAdmin">
          <el-icon><User /></el-icon>
          账号管理
        </el-button>
        <el-button @click="router.push('/homepage')" v-if="userStore.isAdmin">
          <el-icon><Setting /></el-icon>
          首页配置
        </el-button>
      </div>
    </el-card>
    
    <!-- 系统信息 -->
    <el-card class="system-info" shadow="never">
      <template #header>
        <span class="card-title">系统信息</span>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="系统名称">乐星融合学校数字化教学管理系统</el-descriptions-item>
        <el-descriptions-item label="版本号">v1.0.0</el-descriptions-item>
        <el-descriptions-item label="当前角色">{{ currentRoleLabel }}</el-descriptions-item>
        <el-descriptions-item label="登录时间">{{ loginTime }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ROLE_NAMES } from '@/types/user'

const router = useRouter()
const userStore = useUserStore()

// 统计数据
const stats = ref({
  userCount: 0,
  articleCount: 0,
  publishedCount: 0,
  totalViews: 0
})

// 当前日期
const currentDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

// 当前角色标签
const currentRoleLabel = computed(() => {
  return userStore.userRole ? ROLE_NAMES[userStore.userRole] : '未知'
})

// 登录时间
const loginTime = computed(() => {
  if (userStore.user?.last_login_at) {
    return new Date(userStore.user.last_login_at).toLocaleString('zh-CN')
  }
  return '首次登录'
})

// 加载统计数据
onMounted(async () => {
  // TODO: 从 API 获取统计数据
  stats.value = {
    userCount: 128,
    articleCount: 45,
    publishedCount: 38,
    totalViews: 12580
  }
})
</script>

<style scoped>
.dashboard-page {
  max-width: 1200px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 24px;
}

/* 欢迎卡片 */
.welcome-card {
  margin-bottom: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.welcome-card :deep(.el-card__body) {
  padding: 32px;
}

.welcome-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.welcome-text h2 {
  color: #fff;
  font-size: 24px;
  margin: 0 0 8px;
}

.welcome-text p {
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.welcome-icon {
  font-size: 48px;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 12px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.users {
  background: rgba(102, 126, 234, 0.1);
}

.stat-icon.articles {
  background: rgba(118, 75, 162, 0.1);
}

.stat-icon.published {
  background: rgba(16, 185, 129, 0.1);
}

.stat-icon.views {
  background: rgba(245, 158, 11, 0.1);
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}

/* 快捷操作 */
.quick-actions {
  margin-bottom: 24px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.actions-grid {
  display: flex;
  gap: 12px;
}

/* 系统信息 */
.system-info :deep(.el-descriptions__label) {
  width: 120px;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
