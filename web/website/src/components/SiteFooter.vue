<template>
  <footer class="site-footer">
    <div class="container-wide">
      <div class="footer-main grid-3-cols">
        <div class="brand-col">
          <div class="footer-brand">
            <h3 class="footer-brand-title">乐星融合学校</h3>
            <p class="footer-brand-desc">用爱与专业，点亮每一个孩子的成长之路</p>
          </div>
        </div>

        <div class="contact-col">
          <h4 class="footer-title">联系我们</h4>
          <address class="footer-address" style="white-space: pre-line">
            {{ contactText }}
          </address>
          <div class="social-links">
            <a href="#" class="social-icon">微信</a>
            <a href="#" class="social-icon">抖音</a>
            <a href="#" class="social-icon">小红书</a>
          </div>
        </div>

        <div class="links-col">
          <h4 class="footer-title">实用链接</h4>
          <ul class="clean-list">
            <li><a href="#">联系我们</a></li>
            <li><a href="#">最新消息</a></li>
            <li><a href="#">工作机会</a></li>
            <li><a href="#">场地租赁</a></li>
          </ul>
          <div class="partner-logos">
            <span class="placeholder-partner">ISO认证</span>
            <span class="placeholder-partner">协会会员</span>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <div class="container-wide flex-space-between">
        <div class="copyright-info">
          © 2024 乐星融合学校 版权所有 |
          <a href="#" class="accent-link line-link">隐私政策</a> |
          <a href="#" class="accent-link line-link">服务条款</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { homepageConfig } from '@/composables/useHomepageConfig'

const contact = computed(() => homepageConfig.value.contact)
const contactText = computed(() => {
  const c = contact.value
  const parts = [c?.address || '北京市朝阳区\n某某路123号']
  if (c?.phone) parts.push('\n电话: ' + c.phone)
  if (c?.email) parts.push('\n邮箱: ' + c.email)
  if (c?.working_hours) parts.push('\n工作时间: ' + c.working_hours)
  return parts.join('')
})
</script>
