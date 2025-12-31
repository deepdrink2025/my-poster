<template>
  <view class="welcome-view">
    <image src="/static/logo.png" class="welcome-logo" mode="aspectFit"></image>
    <text class="welcome-text">请尽情描述您想要的画面吧 ✨</text>
    <!-- 示例 Prompt -->
    <view class="example-prompts">
      <view class="example-title">示例</view>
      <view class="example-prompt-tag" @click="handleSelect('一只可爱的猫咪，赛博朋克风格')">可爱的猫咪</view>
      <view class="example-prompt-tag" @click="handleSelect('日落时分的海滩，梵高风格')">梵高海滩</view>
      <view class="example-prompt-tag" @click="handleSelect('未来城市的空中花园')">空中花园</view>
    </view>
  </view>
</template>

<script setup>
import { defineEmits } from 'vue';

const emit = defineEmits(['select']);

const handleSelect = (text) => {
  emit('select', text);
};
</script>

<style scoped>
.welcome-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #a0aec0;
  text-align: center;
  height: 100%; /* 占满父容器高度 */
}

.welcome-logo {
  width: 80px;
  height: 80px;
  opacity: 0.6;
}

.welcome-text {
  margin-top: 10px;
  font-size: 16px;
}

.example-prompts {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  flex-wrap: wrap; /* 允许换行 */
  justify-content: center; /* 居中对齐 */
}

.example-title {
  width: 100%;
  font-size: 14px;
  color: #888;
  margin-bottom: 5px;
}

.example-prompt-tag {
  background-color: #e2e8f0;
  color: #4a5568;
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 13px;
  cursor: pointer;
}
</style>