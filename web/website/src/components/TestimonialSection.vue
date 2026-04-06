<template>
  <section ref="sectionRef" class="testimonial-section" id="testimonials">
    <div class="testimonial-grid">
      <div class="testimonial-media observe-target">
        <video
          controls
          preload="metadata"
          poster="https://images.unsplash.com/photo-1544365558-35aa4af41199?q=80&w=2500&auto=format&fit=crop"
        >
          <source
            src="https://cdn.pixabay.com/video/2020/05/24/40061-424683057_large.mp4"
            type="video/mp4"
          />
          您的浏览器不支持 HTML5 视频标签。
        </video>
      </div>

      <div class="testimonial-content observe-target">
        <blockquote class="quote-text">
          在这里，我第一次看到了孩子主动伸出手的瞬间。那种被理解、被接纳的氛围，是我们寻觅已久的奇迹。
        </blockquote>
        <p class="quote-author">星星（化名）的妈妈，入园 1 年</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useIntersectionObserverMulti } from '@/composables/useIntersectionObserver'

const sectionRef = ref<HTMLElement | null>(null)
useIntersectionObserverMulti(sectionRef, '.observe-target', 'is-visible', { threshold: 0.25 })
</script>
