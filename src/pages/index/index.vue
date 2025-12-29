// file: src/pages/index/index.vue
<template>
  <view class="container">
    <view class="header">
      <view class="title-wrapper">
        <text class="title">种草海报PPT神器</text>
        <uni-icons class="more-icon" type="more-filled" size="22" color="#888" @click="showMoreOptions"></uni-icons>
      </view>
      <text class="subtitle">输入奇思妙想，即刻生成艺术作品</text>
    </view>

    <!-- 主要内容区域：用于显示加载、错误和结果 -->
    <view class="main-content">
      <scroll-view :scroll-y="true" :scroll-into-view="scrollIntoViewId" :scroll-top="scrollTop" :scroll-with-animation="true" class="chat-list">
        <view class="chat-list-content">
          <!-- 初始欢迎状态 -->
          <view v-if="chatHistory.length === 0" class="welcome-view">
            <image src="/static/logo.png" class="welcome-logo" mode="aspectFit"></image>
            <text class="welcome-text">请尽情描述您想要的画面吧 ✨</text>
            <!-- 新增：示例 Prompt -->
            <view class="example-prompts">
              <view class="subtitle">示例</view>
              <view class="example-prompt-tag" @click="useExamplePrompt('一只可爱的猫咪，赛博朋克风格')">可爱的猫咪</view>
              <view class="example-prompt-tag" @click="useExamplePrompt('日落时分的海滩，梵高风格')">梵高海滩</view>
              <view class="example-prompt-tag" @click="useExamplePrompt('未来城市的空中花园')">空中花园</view>
            </view>
          </view>

          <!-- 聊天记录 -->
          <view v-for="(message, index) in chatHistory" :key="message.id" :id="'msg-' + message.id" class="chat-message" :class="['message-' + message.role]">
            <!-- 用户消息 -->
            <view v-if="message.role === 'user'" class="message-bubble user-bubble">
              <text>{{ message.content }}</text>
            </view>

            <!-- AI 消息 -->
            <view v-if="message.role === 'assistant'" class="message-bubble assistant-bubble">
              <!-- 加载状态 -->
              <view v-if="message.type === 'loading'" class="loading-state">
                <view class="thinking-dots">
                  <view class="dot"></view><view class="dot"></view><view class="dot"></view>
                </view>
                <view class="loading-text">{{ message.content }}</view>
                <!-- 新增：模拟进度条 -->
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
                <image :src="message.content" class="result-image" mode="widthFix" />
                <view v-if="message.originalContent" class="action-buttons fade-in">
                  <view class="action-button" @click="save(message.originalContent)">
                    <image src="/static/download.svg" class="action-icon" />
                    <text class="action-text">无水印保存</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 底部表单区域 -->
    <view class="form-area">
      <PromptForm @submit="handleGenerate" :loading="loading" v-model="promptText" />
    </view>

    <!-- 用于绘制水印的离屏 Canvas -->
    <canvas
      canvas-id="watermarkCanvas"
      id="watermarkCanvas"
      class="offscreen-canvas"
      :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
    ></canvas>

  </view>
</template>

<script setup>
import { ref, nextTick, watch, getCurrentInstance, onMounted } from 'vue';
import PromptForm from '@/components/PromptForm.vue';
import api from '@/utils/api'; // 导入API工具
import platform from '@/utils/platform'; // 导入平台抽象工具

const loading = ref(false);
const canvasWidth = ref(1); // 默认值，确保 canvas 存在
const canvasHeight = ref(1); // 默认值，确保 canvas 存在

// 获取当前组件实例，用于 CanvasContext
const instance = getCurrentInstance();

const chatHistory = ref([]); // 默认为空数组，不再从本地存储加载
const promptText = ref(''); // 用于双向绑定 PromptForm 的值
let loadingInterval = null; // 用于加载文案的定时器

const scrollIntoViewId = ref('');
const scrollTop = ref(0);
const updateScrollToLast = () => {
  nextTick(() => {
    const arr = chatHistory.value;
    if (arr.length > 0) {
      const last = arr[arr.length - 1];
      scrollIntoViewId.value = 'msg-' + last.id;
      scrollTop.value = Number.MAX_SAFE_INTEGER;
    } else {
      scrollIntoViewId.value = '';
      scrollTop.value = 0;
    }
  });
};
onMounted(() => {
  updateScrollToLast();
});
watch(() => chatHistory.value.length, () => {
  updateScrollToLast();
});

/**
 * 处理表单提交，调用API生成图片
 * @param {object} payload - 包含 prompt 的对象
 */
const handleGenerate = async (payload) => {
  // 提交后清空输入框
  promptText.value = '';

  const { prompt } = payload;
  if (!prompt) {
    uni.showToast({
      title: '请输入提示词',
      icon: 'none'
    });
    return;
  }

  loading.value = true;
  // 保持屏幕常亮，防止用户在等待过程中自动锁屏
  uni.setKeepScreenOn({ keepScreenOn: true });

  // 1. 添加用户消息
  const userMessage = {
    id: Date.now(),
    role: 'user',
    type: 'text',
    content: prompt,
  };
  chatHistory.value.push(userMessage);

  // 2. 添加 AI 加载中消息
  const assistantMessageId = Date.now() + 1;
  const assistantLoadingMessage = {
    id: assistantMessageId,
    role: 'assistant',
    type: 'loading',
    content: '正在解析您的奇思妙想...', // 初始加载文案
    progress: 0, // 初始进度
  };
  chatHistory.value.push(assistantLoadingMessage);

  // 启动模拟进度条和动态文案
  let currentProgress = 0;
  const loadingMessageIndex = chatHistory.value.length - 1;
  if (loadingInterval) clearInterval(loadingInterval); // 清除上一个定时器
  
  loadingInterval = setInterval(() => {
    // 模拟进度增长：前期快，后期慢，逼近 99%
    // 假设平均耗时 2 分钟左右，调整参数使其增长更平缓
    const remaining = 99 - currentProgress;
    const increment = Math.max(0.02, remaining * 0.004); // 降低增速系数，适配较长的生成时间
    currentProgress = Math.min(99, currentProgress + increment);

    if (chatHistory.value[loadingMessageIndex] && chatHistory.value[loadingMessageIndex].type === 'loading') {
      chatHistory.value[loadingMessageIndex].progress = Math.floor(currentProgress);
      // 根据进度切换文案，让用户感觉有阶段性进展
      if (currentProgress < 20) chatHistory.value[loadingMessageIndex].content = '正在解析您的奇思妙想...';
      else if (currentProgress < 40) chatHistory.value[loadingMessageIndex].content = '正在构思画面构图...';
      else if (currentProgress < 60) chatHistory.value[loadingMessageIndex].content = '正在混合色彩与光影...';
      else if (currentProgress < 80) chatHistory.value[loadingMessageIndex].content = 'AI 正在挥洒细节...';
      else chatHistory.value[loadingMessageIndex].content = '正在进行最后的润色...';
    }
  }, 200); // 每 200ms 更新一次，动画更丝滑


  try {
    // 创建一个至少延迟 1.5 秒的 Promise
    const minDelay = new Promise(resolve => setTimeout(resolve, 1500));

    // 同时发起 API 请求和等待最小延迟
    const [res] = await Promise.all([
      // 1. 修改API请求，期望接收二进制数据
      api.post('/api/generate', { prompt }, { responseType: 'blob' }),
      minDelay
    ]);

    if (!res) {
      throw new Error('后端未返回有效数据');
    }

    const index = chatHistory.value.findIndex(m => m.id === assistantMessageId);
    // 2. 更新 AI 消息为图片
    if (index !== -1) {
      let originalImageUrl = '';
      // 3. 根据不同平台处理返回结果，获取原始图片URL
      // #ifdef H5
      // H5 环境下，res 是 Blob，需要创建 Object URL
      if (res instanceof Blob) {
        originalImageUrl = URL.createObjectURL(res);
      }
      // #endif
      // #ifdef MP-WEIXIN
      // 小程序环境下，res 直接就是临时文件路径 (string)
      if (typeof res === 'string') {
        originalImageUrl = res;
      }
      // #endif

      // 4. 使用原始 URL 生成带水印的图片 URL
      const watermarkedUrl = await addWatermark(originalImageUrl);
      // 5. 更新聊天记录，同时保存原始URL(originalContent)和带水印的URL(content)
      chatHistory.value[index] = { ...chatHistory.value[index], type: 'image', content: watermarkedUrl, originalContent: originalImageUrl };
    }
  } catch (e) {
    console.error('API request failed:', e);
    const index = chatHistory.value.findIndex(m => m.id === assistantMessageId);
    // 3. 更新 AI 消息为错误
    if (index !== -1) {
      chatHistory.value[index] = { ...chatHistory.value[index], type: 'error', content: e.message || '生成图片失败，请稍后再试' };
    }
  } finally {
    loading.value = false;
    uni.setKeepScreenOn({ keepScreenOn: false }); // 恢复屏幕自动休眠
    if (loadingInterval) {
      clearInterval(loadingInterval);
      loadingInterval = null;
    }
  }
};

/**
 * 预览图片
 */
// const handlePreviewImage = (url) => {
//   if (url) {
//     platform.previewImage([url]);
//   }
// };

/**
 * 使用示例 Prompt
 * @param {string} text - 示例提示词
 */
const useExamplePrompt = (text) => {
  // 填充输入框并直接触发生成
  promptText.value = text;
  handleGenerate({ prompt: text });
};

/**
 * 显示更多操作菜单
 */
const showMoreOptions = () => {
  uni.showActionSheet({
    itemList: ['清空对话记录'],
    itemColor: '#e53e3e', // 将清空选项设为红色以示警告
    success: (res) => {
      if (res.tapIndex === 0) {
        // 用户点击了“清空对话记录”
        confirmClearHistory();
      }
    },
    fail: (res) => {
      console.log(res.errMsg);
    }
  });
};

/**
 * 确认清空历史记录
 */
const confirmClearHistory = () => {
  uni.showModal({
    title: '确认操作',
    content: '确定要清空所有对话记录吗？此操作不可恢复。',
    success: (res) => {
      if (res.confirm) {
        clearHistory();
      }
    }
  });
};

/**
 * 清空历史记录
 */
const clearHistory = () => {
  chatHistory.value = []; // 清空视图
};

/**
 * 保存海报到相册
 */
const save = async (url) => {
  if (!url) return;
  try {
    await platform.saveImage(url);
    uni.showToast({ title: '已保存到相册', icon: 'success' });
  } catch (e) {
    console.error('Save image failed:', e);
    // H5环境saveImage会失败，引导用户使用下载按钮
    // #ifdef H5
    uni.showToast({ title: 'H5环境请使用“H5下载”按钮', icon: 'none' });
    return;
    // #endif
    uni.showToast({
      title: '保存失败',
      icon: 'none'
    });
  }
};

/**
 * H5环境下载图片
 */
const downloadForH5 = (url) => {
  if (!url) return;
  platform.h5Download(url);
};

/**
 * 给图片添加水印
 * @param {string} originalUrl - 原始图片地址
 * @returns {Promise<string>} - 返回带水印的临时图片地址
 */
const addWatermark = async (originalUrl) => {
  try {
    // 1. 获取图片信息
    const imageInfo = await new Promise((resolve, reject) => {
      uni.getImageInfo({ src: originalUrl, success: resolve, fail: reject });
    });

    const { width, height, path: imagePath } = imageInfo;
    canvasWidth.value = width;
    canvasHeight.value = height;

    // 等待 Canvas 尺寸更新
    await nextTick();

    const canvasId = 'watermarkCanvas';
    const ctx = uni.createCanvasContext(canvasId, instance);
    if (!ctx) {
      throw new Error('无法创建 Canvas 上下文');
    }

    // 2. 绘制原始图片
    ctx.drawImage(imagePath, 0, 0, width, height);

    // 3. 设置水印样式并计算文本宽度（仅一次）
    const watermarkText = '点击保存按钮获取无水印高清大图';
    const fontSize = Math.max(14, width / 25);
    const rotation = -20;
    ctx.font = `${fontSize}px sans-serif`; // uni-app canvas 推荐使用 ctx.font
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    const textWidth = ctx.measureText(watermarkText).width;

    // 4. 优化平铺绘制逻辑
    const gapX = textWidth + 80;
    const gapY = fontSize * 5;
    for (let y = 0; y < height + gapY; y += gapY) {
      for (let x = 0; x < width + gapX; x += gapX) {
        ctx.save(); // 保存当前状态
        ctx.translate(x, y); // 移动坐标原点
        ctx.rotate(rotation * Math.PI / 180); // 旋转
        ctx.fillText(watermarkText, 0, 0); // 在新原点绘制文本
        ctx.restore(); // 恢复到上一个状态
      }
    }

    // 5. 将 Canvas 导出为临时文件
    return await new Promise((resolve, reject) => {
      ctx.draw(false, () => {
        uni.canvasToTempFilePath({
          canvasId, x: 0, y: 0, width, height, destWidth: width, destHeight: height,
          success: (res) => resolve(res.tempFilePath),
          fail: reject
        });
      });
    });
  } catch (error) {
    console.error('添加水印失败:', error);
    // 如果添加水印失败，直接返回原始图片URL，避免流程中断
    return originalUrl;
  }
};



</script>

<style scoped>

.fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh; /* 使用 min-height 替代 height */
  width: 100%;
  box-sizing: border-box;
  background-color: #f4f4f5;
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
  /* 适配顶部安全区域（刘海屏）：背景填满整个顶部，内容从安全区域下方开始 */
  padding: calc(20px + env(safe-area-inset-top)) 20px 10px;
  text-align: center;
  background-color: #f4f4f5; /* 增加背景色以防内容穿透 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); /* 增加细微阴影以区分层次 */
}

.title-wrapper {
  position: relative; /* 为绝对定位的图标提供容器 */
  display: flex;
  align-items: center;
  justify-content: center; /* 确保标题在 flex 容器中居中 */
}

.title {
  font-size: 22px;
  font-weight: bold;
  color: #333;
  text-align: center; /* 确保文本本身是居中的 */
}

.more-icon {
  position: absolute; /* 绝对定位，脱离文档流 */
  right: 0; /* 定位到容器的右侧 */
}

.subtitle {
  font-size: 14px;
  color: #888;
  margin-top: 4px;
  display: block;
}

.main-content {
  flex: 1;
  position: relative; /* 创建新的堆叠上下文 */
  width: 100%;
  box-sizing: border-box;  
  padding-top: calc(70px + env(safe-area-inset-top));
  padding-bottom: calc(95px + env(safe-area-inset-bottom)); /* 底部安全区域适配 */
}

.chat-list {
  width: 100%;
  height: 100%;
  padding: 15px; /* 统一内边距 */
  box-sizing: border-box;
}



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

.example-prompt-tag {
  background-color: #e2e8f0;
  color: #4a5568;
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 13px;
  cursor: pointer;
}


.form-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 15px 15px calc(15px + env(safe-area-inset-bottom)); /* 适配底部安全区 */
  background-color: #ffffff;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.06);
}

.offscreen-canvas {
  position: fixed;
  left: -9999px; /* 将 canvas 移出屏幕外 */
  top: -9999px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #666;
  padding: 10px;
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
  background-color: #4a90e2;
  transition: width 0.2s linear;
}

.loading-hint {
  font-size: 12px;
  color: #a0aec0;
}

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

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dot-breath {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1.0); }
}


.result-area {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

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

.user-bubble {
  background-color: #4a90e2;
  color: white;
  border-top-right-radius: 4px;
}

.assistant-bubble {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-top-left-radius: 4px;
  padding: 10px 15px; /* 统一内边距 */
  min-width: 260px; /* 设置最小宽度，避免内容过少时气泡太窄 */
  box-sizing: border-box;
}

.result-image {
  width: 100%; /* 图片宽度撑满气泡 */
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.action-buttons {
  display: flex;
  justify-content: flex-end; /* 按钮靠右对齐 */
  width: 100%;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 20px;
  background-color: #f0f0f0;
  transition: background-color 0.2s ease;
}
.action-button:active {
  background-color: #e0e0e0;
}
.action-icon {
  width: 16px;
  height: 16px;
}
.action-text {
  font-size: 13px;
  color: #333;
}
</style>

<!--
验收标准:
- 输入 prompt -> 触发 POST /api/generate -> 返回 URL -> 页面显示图片；
- 点击图片 -> 调用 platform.previewImage；
- 点击“保存” -> 调用 platform.saveImage（小程序需要授权），H5 点击“下载”触发 platform.h5Download。
-->
