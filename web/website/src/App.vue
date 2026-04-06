<template>
  <div class="site-root">
    <HeroSection />
    <EthosSection />
    <FacilitySection />
    <WhyChooseUsSection />
    <NewsSection />
    <TestimonialSection />
    <SocialMatrixSection />
    <ConsultationSection />
    <SiteFooter />
    <GlobalCta />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { loadHomepageConfig } from '@/composables/useHomepageConfig'
import HeroSection from '@/components/HeroSection.vue'
import EthosSection from '@/components/EthosSection.vue'
import FacilitySection from '@/components/FacilitySection.vue'
import WhyChooseUsSection from '@/components/WhyChooseUsSection.vue'
import NewsSection from '@/components/NewsSection.vue'
import TestimonialSection from '@/components/TestimonialSection.vue'
import SocialMatrixSection from '@/components/SocialMatrixSection.vue'
import ConsultationSection from '@/components/ConsultationSection.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import GlobalCta from '@/components/GlobalCta.vue'

onMounted(async () => {
  try {
    await loadHomepageConfig()
  } catch (e) {
    console.warn('[首页配置] 拉取失败，使用默认内容:', e)
  }
  setTimeout(() => {
    document.body.classList.remove('is-loading')
    document.body.classList.add('is-loaded')
    const remove = (window as unknown as { __removeLoadingFallback?: () => void }).__removeLoadingFallback
    if (typeof remove === 'function') remove()
  }, 100)
})
</script>

<style scoped>
.site-root {
  min-height: 100%;
}
</style>
