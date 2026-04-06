<template>
  <section ref="containerRef" class="why-choose-us-container" id="why-choose-us">
    <div class="sticky-viewport">
      <header class="fixed-header">
        <h2 class="main-title">{{ whyChooseUs.title || '为什么选择我们' }}</h2>
        <div class="wave-wrapper">
          <svg class="wave-svg" viewBox="0 0 200 20" preserveAspectRatio="none">
            <path
              d="M 0 10 Q 25 0 50 10 Q 75 20 100 10 Q 125 0 150 10 Q 175 20 200 10"
              fill="none"
              stroke="#E2A76F"
              stroke-width="2.5"
              stroke-linecap="round"
            />
          </svg>
        </div>
        <p class="sub-title">我们的独特之处</p>
      </header>

      <div ref="trackRef" class="horizontal-track">
        <article
          v-for="(item, i) in whyItems"
          :key="i"
          :class="['panel', 'panel-' + ((i % 4) + 1)]"
        >
          <div class="panel-content">
            <h3 class="panel-title">{{ item.title }}</h3>
            <p class="panel-desc">{{ item.description }}</p>
            <span v-if="i === 1" class="signature">— 乐星创办人</span>
          </div>
          <template v-if="(i % 4) === 0">
            <div class="panel-image-wrapper">
              <img
                :src="item.icon || defaultImages[i % defaultImages.length]"
                :alt="item.title"
                class="panel-img"
              />
            </div>
            <div class="panel-blank"></div>
          </template>
          <template v-else>
            <div class="panel-blank"></div>
            <div class="panel-image-wrapper full-radius">
              <img
                :src="item.icon || defaultImages[i % defaultImages.length]"
                :alt="item.title"
                class="panel-img"
              />
            </div>
          </template>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { homepageConfig } from '@/composables/useHomepageConfig'

const containerRef = ref<HTMLElement | null>(null)
const whyChooseUs = computed(() => homepageConfig.value.why_choose_us)
const whyItems = computed(() => {
  const items = whyChooseUs.value?.items
  if (items?.length) return items
  return [
    { title: '我们的价值观', description: '在乐星，我们相信每个孩子都是宇宙中独一无二的星体。我们不强求整齐划一的轨道，而是致力于发现并点亮他们原有的运行轨迹。', icon: '' },
    { title: '校长致辞', description: '"真正的融合，不是让孩子们努力伪装成普通人的样子，而是教导整个世界去拥抱神经多样性。这是乐星建立的初衷，也是我们每日践行的使命。"', icon: '' },
    { title: '师资力量支撑', description: '我们汇聚了BCBA认证行为分析师、资深言语治疗师(ST)及作业治疗师(OT)。以1:1或1:2的极致师生比，确保护理的极度专业与专注。', icon: '' },
    { title: '完整的教学规划', description: '从科学全面的入校评估，到定制化IEP个别教育计划；从密集的早期干预，到学龄期的融合过渡。我们为您规划一条清晰可见的成长路径。', icon: '' }
  ]
})
const defaultImages = [
  'https://images.unsplash.com/photo-1544365558-35aa4af41199?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1602052793312-b99c2a9ee797?q=80&w=1200&auto=format&fit=crop'
]
const trackRef = ref<HTMLElement | null>(null)
let isTicking = false

function updateHorizontalScroll() {
  const container = containerRef.value
  const track = trackRef.value
  if (!container || !track) return

  if (window.innerWidth <= 768) {
    track.style.transform = 'none'
    isTicking = false
    return
  }

  const rect = container.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const maxScrollDistance = rect.height - viewportHeight
  const currentScroll = -rect.top
  let progress = currentScroll / maxScrollDistance
  progress = Math.max(0, Math.min(1, progress))
  const movePercentage = progress * -75
  track.style.transform = `translate3d(${movePercentage}%, 0, 0)`
  isTicking = false
}

function onScroll() {
  if (!isTicking) {
    window.requestAnimationFrame(updateHorizontalScroll)
    isTicking = true
  }
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  updateHorizontalScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
})
</script>
