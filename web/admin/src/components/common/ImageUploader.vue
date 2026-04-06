<template>
  <div class="image-uploader">
    <el-upload
      class="uploader"
      :class="{ 'has-image': !!imageUrl }"
      :show-file-list="false"
      :before-upload="beforeUpload"
      :http-request="handleUpload"
      :disabled="uploading"
    >
      <img v-if="imageUrl" :src="imageUrl" class="preview-image" />
      <div v-else class="upload-placeholder">
        <el-icon v-if="!uploading" class="upload-icon"><Plus /></el-icon>
        <el-icon v-else class="is-loading"><Loading /></el-icon>
        <span class="upload-text">{{ uploading ? '上传中...' : placeholder }}</span>
      </div>
    </el-upload>
    
    <div v-if="imageUrl && showRemove" class="remove-btn">
      <el-button type="danger" size="small" @click="handleRemove">
        删除
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, type UploadRequestOptions } from 'element-plus'
import { uploadApi } from '@/api/upload'

interface Props {
  modelValue?: string
  placeholder?: string
  maxSize?: number // MB
  showRemove?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '点击上传图片',
  maxSize: 10,
  showRemove: true
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
  (e: 'upload', data: { key: string; url: string }): void
}>()

const uploading = ref(false)
const imageUrl = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val)
    emit('change', val)
  }
})

/**
 * 上传前验证
 */
function beforeUpload(file: File) {
  // 验证文件类型
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  
  // 验证文件大小
  const isLtSize = file.size / 1024 / 1024 < props.maxSize
  if (!isLtSize) {
    ElMessage.error(`图片大小不能超过 ${props.maxSize}MB`)
    return false
  }
  
  return true
}

/**
 * 处理上传
 */
async function handleUpload(options: UploadRequestOptions) {
  uploading.value = true
  
  try {
    const result = await uploadApi.uploadImage(options.file as File)
    
    imageUrl.value = result.url
    emit('upload', { key: result.key, url: result.url })
    
    ElMessage.success('上传成功')
  } catch (error: any) {
    ElMessage.error(error.message || '上传失败')
  } finally {
    uploading.value = false
  }
}

/**
 * 删除图片
 */
function handleRemove() {
  imageUrl.value = ''
}
</script>

<style scoped>
.image-uploader {
  display: inline-block;
  position: relative;
}

.uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.3s;
}

.uploader:hover {
  border-color: #409eff;
}

.uploader.has-image {
  border: none;
}

.upload-placeholder {
  width: 148px;
  height: 148px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}

.upload-icon {
  font-size: 28px;
  color: #8c939d;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 12px;
  color: #8c939d;
}

.preview-image {
  width: 148px;
  height: 148px;
  object-fit: cover;
  display: block;
}

.remove-btn {
  margin-top: 8px;
  text-align: center;
}
</style>
