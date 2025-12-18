// file: src/components/PromptForm.vue
<template>
  <view class="prompt-form">
    <textarea
      v-model="prompt"
      class="prompt-textarea"
      placeholder="请输入你的创意或描述（内容、尺寸等）..."
      :disabled="loading"
      auto-height
      maxlength="-1"
    />
    <view
      class="submit-button"
      @click="handleSubmit"
      :disabled="loading"
    > 
      <image v-if="!loading" src="/static/paperplane.svg" class="submit-icon" />
      <view v-if="loading" class="button-loading-spinner"></view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';  

// 定义 props 和 emits
defineProps({
  loading: {
    type: Boolean,
    default: false
  }
});
const emit = defineEmits(['submit']);

const prompt = ref('');

const handleSubmit = () => {
  const trimmedPrompt = prompt.value.trim();
  if (!trimmedPrompt) {
    // #ifdef MP-WEIXIN
    uni.showToast({
      title: '提示词不能为空哦',
      icon: 'none'
    });
    // #endif
    // #ifndef MP-WEIXIN
    alert('提示词不能为空哦');
    // #endif
    return;
  }
  emit('submit', { prompt: trimmedPrompt });

  // 提交后清空输入框
  prompt.value = '';
};
</script>

<style scoped>
.prompt-form {
  width: 100%;
  display: flex;
  align-items: flex-end; /* 底部对齐 */
  gap: 10px;
}

.prompt-textarea {
  flex: 1;
  min-height: 24px; /* 初始高度，约一行 */
  max-height: 96px; /* 最大高度，约四行，超出后可滚动 */
  padding: 10px 15px;
  border: 1px solid #dcdfe6;
  border-radius: 23px; /* 调整为适中的圆角，以适应多行场景 */
  box-sizing: border-box;
  font-size: 14px;
  background-color: #f8f8f8;
  line-height: 1.5; /* 保证文字在单行内垂直居中 */
  overflow-y: auto; /* 超出最大高度后显示垂直滚动条 */
}

.prompt-textarea:focus {
  border-color: #4a90e2;
  background-color: #fff;
}

.submit-button {
  line-height: 1;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.submit-icon {
  width: 24px;
  height: 24px;
}


.submit-button[disabled] {
  opacity: 0.5;
}

.submit-button:active {
  opacity: 0.8;
}

.button-loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-left-color: #4a90e2;
  border-radius: 50%;
  animation: button-spin 1s linear infinite;
}

@keyframes button-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

<!--
验收标准:
- 输入非空文本并点提交会 emit submit 事件；
- 空输入会给出友好提示（小程序使用 uni.showToast，H5 使用 alert）。
-->
