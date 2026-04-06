<template>
  <section ref="sectionRef" class="social-matrix-section" id="social-feed">
    <header class="matrix-header observe-target">
      <h2 class="matrix-title">跟着我们</h2>
      <div class="squiggle-wrapper">
        <svg viewBox="0 0 200 20" preserveAspectRatio="none">
          <path
            d="M0,10 Q25,0 50,10 T100,10 T150,10 T200,10"
            fill="none"
            stroke="#5C8BB5"
            stroke-width="3"
            stroke-linecap="round"
          />
        </svg>
      </div>
      <p class="matrix-subtitle">记录孩子们的纯真笑脸，了解我们丰富的康复课程。</p>
    </header>

    <div class="scrapbook-grid">
      <div
        v-for="(card, index) in scrapbookCards"
        :key="index"
        class="scrapbook-card observe-item"
      >
        <img :src="card.img" :alt="card.alt" />
        <div class="hover-mask">
          <div class="mask-content">
            <h4>{{ card.title }}</h4>
            <p>{{ card.desc }}</p>
          </div>
        </div>
      </div>
    </div>

    <footer class="matrix-ctas observe-target">
      <a href="#" class="matrix-btn btn-wechat">
        <svg viewBox="0 0 24 24">
          <path
            d="M8.5,14c-0.83,0-1.5-0.67-1.5-1.5S7.67,11,8.5,11s1.5,0.67,1.5,1.5S9.33,14,8.5,14z M13.5,14c-0.83,0-1.5-0.67-1.5-1.5 S12.67,11,13.5,11s1.5,0.67,1.5,1.5S14.33,14,13.5,14z M11,4c-4.97,0-9,3.36-9,7.5c0,2.36,1.3,4.45,3.34,5.88L4,21l4.47-2.18 C9.27,18.94,10.12,19,11,19c4.97,0,9-3.36,9-7.5S15.97,4,11,4z"
          />
        </svg>
        微信公众号
      </a>
      <a href="#" class="matrix-btn btn-tiktok">
        <svg viewBox="0 0 24 24">
          <path
            d="M12.53,3V17.15c0,2.54-2.07,4.6-4.6,4.6s-4.6-2.06-4.6-4.6,2.07-4.6,4.6-4.6c.4,0,.79,.05,1.17,.16v-3.78c-3.86-.54-6.83,1.39-7.8,4.41C.55,16.27,.82,19.33,2.78,21.3s5.03,2.23,7.11,.24c2.27-2.17,2.21-6.42,2.21-6.42V8.83c1.47,1.05,3.28,1.67,5.23,1.67v-3.69c-2.86,0-5.18-2.32-5.18-5.18V3h-4.62Z"
          />
        </svg>
        抖音
      </a>
      <a href="#" class="matrix-btn btn-channels">
        <svg viewBox="0 0 24 24">
          <path
            d="M17,10.5V7c0-0.55-0.45-1-1-1H4C3.45,6,3,6.45,3,7v10c0,0.55,0.45,1,1,1h12c0,0.55,0.45,1,1,1v-3.5l4,4v-11L17,10.5z"
          />
        </svg>
        微信视频号
      </a>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useIntersectionObserverMulti } from '@/composables/useIntersectionObserver'

const sectionRef = ref<HTMLElement | null>(null)

const scrapbookCards = [
  {
    img: 'https://images.unsplash.com/photo-1502086223501-7ea244b05ffb?q=80&w=800',
    alt: '感统训练',
    title: '感统训练课',
    desc: '通过专业器械提升身体协调与前庭觉发展，建立自信。'
  },
  {
    img: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=800',
    alt: '言语治疗',
    title: '言语沟通课',
    desc: '在自然的情境中诱导发声，点亮沟通的火花。'
  },
  {
    img: 'https://images.unsplash.com/photo-1587653263995-422546a72569?q=80&w=800',
    alt: '艺术疗愈',
    title: '艺术色彩课',
    desc: '用画笔释放内心世界，发现不被定义的表达美感。'
  },
  {
    img: 'https://images.unsplash.com/photo-1519340241574-2dec39624d21?q=80&w=800',
    alt: '融合社交',
    title: '小班社交课',
    desc: '在模拟社交中学会等待与分享，建立同伴链接。'
  }
]

// 头部与底部 observe-target；scrapbook-grid 内 observe-item 用单独逻辑
useIntersectionObserverMulti(sectionRef, '.observe-target', 'is-visible', { threshold: 0.15 })

// 相册墙卡片依次 reveal：观察 .scrapbook-grid 进入视口后给子元素加 .reveal
onMounted(() => {
  const section = sectionRef.value
  if (!section) return
  const grid = section.querySelector('.scrapbook-grid')
  if (!grid) return
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const items = grid.querySelectorAll('.observe-item')
          items.forEach((item, index) => {
            setTimeout(() => item.classList.add('reveal'), index * 150)
          })
          observer.disconnect()
        }
      })
    },
    { root: null, rootMargin: '0px', threshold: 0.15 }
  )
  observer.observe(grid)
})
</script>
