<template>
  <section class="consultation-section" id="consultation">
    <div class="container-narrow">
      <header class="form-header">
        <h2>进行咨询</h2>
        <p>一般咨询请使用此表格。 <a href="#" class="accent-link">点击此处</a>发送入学咨询。</p>
      </header>

      <form class="standard-grid-form" @submit.prevent="onSubmit">
        <div class="form-group col-title">
          <label for="title">称谓 *</label>
          <input
            id="title"
            v-model="form.title"
            type="text"
            class="ghost-input"
            required
          />
        </div>
        <div class="form-group col-firstname">
          <label for="fname">名 *</label>
          <input
            id="fname"
            v-model="form.firstName"
            type="text"
            class="ghost-input"
            required
          />
        </div>
        <div class="form-group col-lastname">
          <label for="lname">姓 *</label>
          <input
            id="lname"
            v-model="form.lastName"
            type="text"
            class="ghost-input"
            required
          />
        </div>

        <div class="form-group col-full">
          <label for="email">电子邮件地址 *</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            class="ghost-input"
            required
          />
        </div>

        <div class="form-group col-full">
          <label for="subject">一般查询主题 *</label>
          <input
            id="subject"
            v-model="form.subject"
            type="text"
            class="ghost-input"
            placeholder="您询问的主题"
            required
          />
        </div>

        <div class="form-group col-full">
          <label for="message">您向学校办公室提出的查询 *</label>
          <textarea
            id="message"
            v-model="form.message"
            class="ghost-input"
            rows="5"
            placeholder="您的询问"
            required
          ></textarea>
        </div>

        <div class="form-group col-full checkbox-group">
          <input id="terms" v-model="form.terms" type="checkbox" required />
          <label for="terms">
            通过此表格提交的数据将根据学校的
            <a href="#" class="accent-link">隐私声明</a>
            进行访问、处理和保留。
          </label>
        </div>

        <div class="form-actions col-full">
          <button type="submit" class="btn-capsule-ghost" :disabled="submitting">
            {{ submitting ? '发送中...' : '发送询价' }}
          </button>
          <p class="recaptcha-text">本网站受 reCAPTCHA 保护，并适用 Google 隐私政策和服务条款。</p>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

const submitting = ref(false)
const form = reactive({
  title: '',
  firstName: '',
  lastName: '',
  email: '',
  subject: '',
  message: '',
  terms: false
})

function onSubmit() {
  submitting.value = true
  setTimeout(() => {
    alert(
      `感谢您的咨询，${form.lastName}${form.title}！我们会尽快回复您的邮箱：${form.email}`
    )
    form.title = ''
    form.firstName = ''
    form.lastName = ''
    form.email = ''
    form.subject = ''
    form.message = ''
    form.terms = false
    submitting.value = false
  }, 1500)
}
</script>
