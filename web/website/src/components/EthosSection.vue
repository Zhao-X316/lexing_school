<template>
  <section ref="sectionRef" class="ethos-section" id="ethos">
    <div class="ethos-grid">
      <div class="ethos-media-wrapper observe-target">
        <div class="ethos-media">
          <video
            autoplay
            loop
            muted
            playsinline
            poster="https://images.unsplash.com/photo-1602052793312-b99c2a9ee797?q=80&w=2500&auto=format&fit=crop"
          >
            <source
              src="https://cdn.pixabay.com/video/2020/05/24/40061-424683057_large.mp4"
              type="video/mp4"
            />
          </video>
        </div>
      </div>

      <div class="ethos-content observe-target">
        <span class="ethos-subtitle">Our Ethos</span>
        <h2 class="ethos-title" style="white-space: pre-line">
          {{ philosophy.title || '在这里，你们不再是\n孤军奋战' }}
        </h2>
        <template v-for="(item, i) in ethosItems" :key="i">
          <h3 v-if="item.title" class="ethos-item-title">{{ item.title }}</h3>
          <p v-if="item.description" class="ethos-desc">{{ item.description }}</p>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useIntersectionObserverMulti } from '@/composables/useIntersectionObserver'
import { homepageConfig } from '@/composables/useHomepageConfig'

const sectionRef = ref<HTMLElement | null>(null)
useIntersectionObserverMulti(sectionRef, '.observe-target', 'is-visible', { threshold: 0.3 })

const philosophy = computed(() => homepageConfig.value.philosophy)
const ethosItems = computed(() => {
  const items = philosophy.value?.items
  if (items?.length) return items
  return [
    { title: '', description: '我们深知，自闭症谱系家庭的旅程充满了未知与挑战。在乐星，我们不视差异为缺陷，而是将其视为每个孩子独特的宇宙。' },
    { title: '', description: '我们的康复体系建立在极度同理心、坚定的决心与科学的干预之上。在这里，每一丝微小的进步都会被看见，每一次情绪的起伏都能被接纳。我们不仅是教育者，更是您最坚实的后盾。' }
  ]
})
</script>
