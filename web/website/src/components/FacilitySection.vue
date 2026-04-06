<template>
  <section ref="sectionRef" class="facility-section" id="facilities">
    <div class="facility-intro observe-container">
      <div class="intro-content">
        <h2 class="huge-text line-left">{{ facilities.title || '参观我们专业的康复室和功能丰富的活动室' }}</h2>
        <a href="#book-tour" class="huge-text line-right link-hover">- 预约参观</a>
      </div>
    </div>

    <div class="facility-details observe-container">
      <div class="facility-grid">
        <div class="facility-text slide-from-left">
          <span class="facility-subtitle">Professional Spaces</span>
          <h3 class="facility-title" style="white-space: pre-line">{{ facilityItem?.name || '安全、纯净的\n成长庇护所' }}</h3>
          <p v-for="(para, i) in facilityDescParas" :key="i" class="facility-desc">{{ para }}</p>
        </div>

        <div class="facility-media slide-from-right">
          <video
            v-if="isVideoUrl(facilityMediaUrl)"
            autoplay
            loop
            muted
            playsinline
            :poster="facilityPoster"
          >
            <source :src="facilityMediaUrl" type="video/mp4" />
          </video>
          <img
            v-else-if="facilityMediaUrl"
            :src="facilityMediaUrl"
            alt="校园设施"
            class="facility-img"
          />
          <video
            v-else
            autoplay
            loop
            muted
            playsinline
            poster="https://images.unsplash.com/photo-1576444356170-66073046b1bc?q=80&w=2500&auto=format&fit=crop"
          >
            <source src="https://cdn.pixabay.com/video/2021/08/24/86131-592323282_large.mp4" type="video/mp4" />
          </video>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useIntersectionObserverMulti } from '@/composables/useIntersectionObserver'
import { homepageConfig } from '@/composables/useHomepageConfig'

const sectionRef = ref<HTMLElement | null>(null)
useIntersectionObserverMulti(sectionRef, '.observe-container', 'is-visible', { threshold: 0.3 })

const facilities = computed(() => homepageConfig.value.facilities)
const facilityItem = computed(() => facilities.value?.items?.[0])
const facilityDescParas = computed(() => {
  const desc = facilityItem.value?.description
  if (!desc) return ['每一间康复室都经过精心的声学与光影设计，确保为孩子们提供低刺激、高包容的感官环境。', '从专业的感统训练中心到个别化干预 (IEP) 教室，我们用医疗级的严谨与教育者的温情，构筑孩子们探索世界的安全基石。']
  return desc.split(/\n+/).filter(Boolean)
})
const facilityMediaUrl = computed(() => facilityItem.value?.image || '')
const facilityPoster = 'https://images.unsplash.com/photo-1576444356170-66073046b1bc?q=80&w=2500&auto=format&fit=crop'

function isVideoUrl(url: string): boolean {
  if (!url) return false
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url)
}
</script>
