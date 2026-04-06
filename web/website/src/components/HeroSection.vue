<template>
  <section class="hero">
    <div class="hero-bg" :style="heroBgStyle"></div>
    <div class="hero-overlay"></div>

    <div class="top-controls reveal-up" style="transition-delay: 0.3s">
      <button class="ctrl-btn icon-only" type="button" aria-label="Search">
        <svg viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </button>
      <button class="ctrl-btn" type="button" aria-label="Menu">
        <span style="font-size: 0.85rem; font-weight: 500; letter-spacing: 1px">MENU</span>
      </button>
      <a
        :href="adminLoginUrl"
        class="ctrl-btn login-btn"
        aria-label="Login"
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg
          viewBox="0 0 24 24"
          style="width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2"
        >
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
          <polyline points="10 17 15 12 10 7"></polyline>
          <line x1="15" y1="12" x2="3" y2="12"></line>
        </svg>
        <span style="font-size: 0.85rem; font-weight: 500; letter-spacing: 1px">LOGIN</span>
      </a>
    </div>

    <div class="title-wrapper">
      <h1 class="main-title reveal-up" style="transition-delay: 0.1s; white-space: pre-line">
        {{ hero.title || '用心呵护，\n每个孩子的星光' }}
      </h1>
    </div>

    <a
      v-if="hero.cta_text"
      :href="hero.cta_link || '#ethos'"
      class="hero-cta reveal-up"
      style="transition-delay: 0.2s"
    >
      {{ hero.cta_text }}
    </a>

    <div class="scroll-hint reveal-up" style="transition-delay: 0.5s">
      <div class="scroll-hint-icon"></div>
      <span>滚动探索</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { homepageConfig } from '@/composables/useHomepageConfig'

const adminLoginUrl = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5001'
const hero = computed(() => homepageConfig.value.hero)

const heroBgStyle = computed(() => {
  const img = hero.value?.background_image
  if (!img) return {}
  return { backgroundImage: `url(${img})` }
})
</script>
