<template>
  <div class="forbidden-page">
    <div class="content">
      <h1 class="error-code">403</h1>
      <p class="error-message">无权限访问</p>
      <p class="error-description">您没有权限访问该页面，请联系管理员。</p>
      <el-button type="primary" @click="router.push('/')">返回首页</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<style scoped>
.forbidden-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.content {
  text-align: center;
  color: #fff;
}

.error-code {
  font-size: 120px;
  font-weight: 700;
  margin: 0;
  line-height: 1;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.error-message {
  font-size: 32px;
  font-weight: 600;
  margin: 16px 0 8px;
}

.error-description {
  font-size: 16px;
  opacity: 0.8;
  margin-bottom: 32px;
}
</style>
