<template>
  <div
    v-show="!secondaryHidden"
    ref="secondaryRef"
    class="global-cta cta-secondary-fixed"
    :class="{ 'cta-shrinking': secondaryShrinking }"
  >
    <a href="#" class="cta-text" style="text-decoration: none; color: inherit">了解康复体系</a>
    <button
      type="button"
      class="close-btn"
      aria-label="关闭"
      @click="closeSecondary"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M18 6L6 18M6 6L18 18"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
        />
      </svg>
    </button>
  </div>

  <a href="#" class="global-cta cta-primary-fixed">预约能力评估</a>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const secondaryHidden = ref(false)
const secondaryShrinking = ref(false)

const secondaryRef = ref<HTMLElement | null>(null)

function closeSecondary() {
  secondaryShrinking.value = true
  const el = secondaryRef.value
  if (el) {
    el.addEventListener('transitionend', function handler(e: TransitionEvent) {
      if (e.propertyName === 'transform') {
        secondaryHidden.value = true
        el.removeEventListener('transitionend', handler)
      }
    })
  }
}
</script>
