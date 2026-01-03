<template>
  <view :id="'msg-' + message.id" class="chat-message" :class="['message-' + message.role]">
    <!-- 用户消息 -->
    <view v-if="message.role === 'user'" class="user-message-container">
      <view class="message-bubble user-bubble">
        <text :selectable="true" :user-select="true">{{ message.content }}</text>
      </view>
      <view class="user-actions">
        <view class="action-item" @click="handleCopy">
          <uni-icons type="paperclip" size="20" color="#999"></uni-icons>
        </view>
        <view class="action-item" @click="handleReEdit">
          <uni-icons type="compose" size="20" color="#999"></uni-icons>
        </view>
      </view>
    </view>

    <!-- AI 消息 -->
    <view v-if="message.role === 'assistant'" class="message-bubble assistant-bubble">
      <!-- 加载状态 -->
      <view v-if="message.type === 'loading'" class="loading-state">
        <view class="thinking-dots">
          <view class="dot"></view><view class="dot"></view><view class="dot"></view>
        </view>
        <view class="loading-text">{{ message.content }}</view>
        <!-- 模拟进度条 -->
        <view class="progress-box" v-if="message.progress !== undefined">
          <view class="progress-bar" :style="{ width: message.progress + '%' }"></view>
        </view>
        <text class="loading-hint">预计耗时 1-2 分钟，请保持屏幕常亮</text>
      </view>
      <!-- 错误提示 -->
      <view v-if="message.type === 'error'" class="error-message">
        <uni-icons type="closeempty" size="20" color="#e53e3e"></uni-icons>
        <text>发生错误：{{ message.content }}</text>
      </view>
      <!-- 结果展示 -->
      <view v-if="message.type === 'image'" class="result-area fade-in">
        <image :src="message.content || message.originalContent" class="result-image" mode="widthFix" />
        <view v-if="message.originalContent" class="action-buttons fade-in">
          <view class="action-button" @click="handleSave">
            <image src="/static/download.svg" class="action-icon" />
            <text class="action-text">无水印保存</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  message: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['save', 're-edit']);

const handleSave = () => {
  emit('save', props.message.originalContent);
};

const handleCopy = () => {
  uni.setClipboardData({
    data: props.message.content
  });
};

const handleReEdit = () => {
  // 抛出事件，由父组件负责将内容填入输入框
  emit('re-edit', props.message.content);
};
</script>

<style scoped>
.chat-message {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

.message-user {
  align-items: flex-end;
}

.message-assistant {
  align-items: flex-start;
}

.message-bubble {
  padding: 10px 15px;
  border-radius: 18px;
  max-width: 100%;
  word-wrap: break-word;
}

.user-message-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.user-actions {
  display: flex;
  gap: 15px;
  margin-top: 6px;
  padding-right: 4px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

.user-bubble {
  background-color: #1677ff;
  color: white;
  border-top-right-radius: 4px;
}

.assistant-bubble {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-top-left-radius: 4px;
  padding: 10px 15px;
  min-width: 260px;
  box-sizing: border-box;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #666;
  padding: 10px;
}

.thinking-dots {
  display: flex;
  gap: 8px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #b0b0b0;
  animation: dot-breath 1.4s infinite ease-in-out both;
}

.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes dot-breath {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1.0); }
}

.progress-box {
  width: 100%;
  height: 6px;
  background-color: #edf2f7;
  border-radius: 3px;
  overflow: hidden;
  margin: 5px 0;
}

.progress-bar {
  height: 100%;
  background-color: #1677ff;
  transition: width 0.2s linear;
}

.loading-hint { font-size: 12px; color: #a0aec0; }

.error-message {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #e53e3e;
  background-color: #fed7d7;
  padding: 10px 15px;
  border-radius: 10px;
  box-sizing: border-box;
  font-size: 14px;
}

.result-area { width: 100%; display: flex; flex-direction: column; gap: 15px; }
.result-image { width: 100%; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }

.action-buttons { display: flex; justify-content: flex-end; width: 100%; }
.action-button { display: flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 20px; background-color: #f0f0f0; transition: background-color 0.2s ease; }
.action-button:active { background-color: #e0e0e0; }
.action-icon { width: 16px; height: 16px; }
.action-text { font-size: 13px; color: #333; }

.fade-in { animation: fadeIn 0.5s ease-in-out; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>