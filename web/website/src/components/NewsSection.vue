<template>
  <section class="news-section" id="news">
    <header class="news-header">
      <h2 class="news-title">公告</h2>
      <p class="news-subtitle">看看我们最近发生了什么</p>
    </header>

    <div class="news-content">
      <div class="news-featured">
        <div class="featured-overlay">
          <h3 class="featured-title">秋季学期新闻</h3>
        </div>
      </div>

      <div ref="sliderWrapperRef" class="news-slider-wrapper" id="sliderWrapper">
        <div ref="sliderTrackRef" class="news-slider-track" id="sliderTrack">
          <article
            v-for="item in newsData"
            :key="item.id"
            class="news-card"
            :data-id="item.id"
          >
            <div class="card-image-box">
              <img :src="item.image" :alt="item.title" loading="lazy" />
            </div>
            <div class="card-text-box">
              <time class="card-date">{{ item.date }}</time>
              <h3 class="card-title">{{ item.title }}</h3>
              <p class="card-excerpt">{{ item.excerpt }}</p>
            </div>
          </article>
        </div>
      </div>
    </div>

    <div class="news-controls">
      <div class="nav-arrows">
        <button
          type="button"
          class="arrow-btn"
          aria-label="上一页"
          :disabled="currentIndex === 0"
          @click="goPrev"
        >
          <svg viewBox="0 0 24 24">
            <path
              d="M15 18l-6-6 6-6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          class="arrow-btn"
          aria-label="下一页"
          :disabled="currentIndex >= totalPages - 1"
          @click="goNext"
        >
          <svg viewBox="0 0 24 24">
            <path
              d="M9 18l6-6-6-6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
      <div class="nav-dots">
        <button
          v-for="(_, i) in totalPages"
          :key="i"
          type="button"
          class="dot"
          :class="{ active: i === currentIndex }"
          :aria-label="`跳转到第 ${i + 1} 页`"
          @click="goToPage(i)"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { newsData } from '@/data/news'

const sliderWrapperRef = ref<HTMLElement | null>(null)
const sliderTrackRef = ref<HTMLElement | null>(null)

const currentIndex = ref(0)
let isAnimating = false
let startX = 0
let currentTranslate = 0
let prevTranslate = 0
let isDragging = false

const visibleCards = computed(() => (window.innerWidth >= 768 ? 2 : 1))
const totalPages = computed(() =>
  Math.max(1, Math.ceil(newsData.length - visibleCards.value + 1))
)

function getCardWidth(): number {
  const wrapper = sliderWrapperRef.value
  if (!wrapper) return 300
  const visible = visibleCards.value
  const gap = visible === 2 ? 32 : 16
  return (wrapper.clientWidth - gap * (visible - 1)) / visible
}

function getTranslate(): number {
  const cardWidth = getCardWidth()
  const gap = visibleCards.value === 2 ? 32 : 16
  return -(currentIndex.value * (cardWidth + gap))
}

function updateSlider() {
  if (window.innerWidth <= 768) return
  const track = sliderTrackRef.value
  if (!track) return
  const translate = getTranslate()
  track.style.transform = `translateX(${translate}px)`
}

function goNext() {
  if (isAnimating || window.innerWidth <= 768) return
  if (currentIndex.value < totalPages.value - 1) {
    currentIndex.value++
    updateSlider()
  }
}

function goPrev() {
  if (isAnimating || window.innerWidth <= 768) return
  if (currentIndex.value > 0) {
    currentIndex.value--
    updateSlider()
  }
}

function goToPage(i: number) {
  if (!isAnimating && i !== currentIndex.value) {
    currentIndex.value = i
    updateSlider()
  }
}

function touchStart(e: TouchEvent | MouseEvent) {
  if (window.innerWidth <= 768) return
  isDragging = true
  startX = 'touches' in e ? e.touches[0].pageX : e.pageX
  if (sliderTrackRef.value) sliderTrackRef.value.style.transition = 'none'
  prevTranslate = currentTranslate
  isAnimating = false
}

function touchMove(e: TouchEvent | MouseEvent) {
  if (!isDragging || window.innerWidth <= 768) return
  const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX
  currentTranslate = prevTranslate + (pageX - startX)
  requestAnimationFrame(() => {
    if (sliderTrackRef.value)
      sliderTrackRef.value.style.transform = `translateX(${currentTranslate}px)`
  })
}

function touchEnd() {
  if (window.innerWidth <= 768) return
  isDragging = false
  const track = sliderTrackRef.value
  if (track) {
    track.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
    const movedBy = currentTranslate - prevTranslate
    const threshold = getCardWidth() * 0.2
    if (movedBy < -threshold && currentIndex.value < totalPages.value - 1)
      currentIndex.value++
    else if (movedBy > threshold && currentIndex.value > 0) currentIndex.value--
    currentTranslate = getTranslate()
    track.style.transform = `translateX(${currentTranslate}px)`
  }
}

function onMouseLeave() {
  if (isDragging) touchEnd()
}

onMounted(() => {
  updateSlider()
  window.addEventListener('resize', updateSlider)
  const track = sliderTrackRef.value
  if (track) {
    track.addEventListener('touchstart', touchStart, { passive: true })
    track.addEventListener('touchmove', touchMove, { passive: true })
    track.addEventListener('touchend', touchEnd)
    track.addEventListener('mousedown', touchStart)
    track.addEventListener('mousemove', touchMove)
    track.addEventListener('mouseup', touchEnd)
    track.addEventListener('mouseleave', onMouseLeave)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateSlider)
  const track = sliderTrackRef.value
  if (track) {
    track.removeEventListener('touchstart', touchStart)
    track.removeEventListener('touchmove', touchMove)
    track.removeEventListener('touchend', touchEnd)
    track.removeEventListener('mousedown', touchStart)
    track.removeEventListener('mousemove', touchMove)
    track.removeEventListener('mouseup', touchEnd)
    track.removeEventListener('mouseleave', onMouseLeave)
  }
})

</script>
