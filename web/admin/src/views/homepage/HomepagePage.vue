<template>
  <div class="homepage-page">
    <h1 class="page-title">首页配置</h1>
    
    <el-card class="config-card" shadow="never">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="首屏Banner" name="hero">
          <HeroConfig />
        </el-tab-pane>
        <el-tab-pane label="核心理念" name="philosophy">
          <PhilosophyConfig />
        </el-tab-pane>
        <el-tab-pane label="设施展示" name="facilities">
          <FacilitiesConfig />
        </el-tab-pane>
        <el-tab-pane label="为什么选择我们" name="why_choose_us">
          <WhyChooseUsConfig />
        </el-tab-pane>
        <el-tab-pane label="联系方式" name="contact">
          <ContactConfig />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import HeroConfig from './components/HeroConfig.vue'
import PhilosophyConfig from './components/PhilosophyConfig.vue'
import FacilitiesConfig from './components/FacilitiesConfig.vue'
import WhyChooseUsConfig from './components/WhyChooseUsConfig.vue'
import ContactConfig from './components/ContactConfig.vue'

const activeTab = ref('hero')
</script>

<style scoped>
.homepage-page {
  max-width: 1200px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 24px;
}

.config-card {
  min-height: 500px;
}
</style>
