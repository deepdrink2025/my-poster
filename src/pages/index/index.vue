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
      <scroll-view :scroll-y="true" :scroll-with-animation="true" class="chat-list">
        <view class="chat-list-content">
          <!-- 初始欢迎状态 -->
          <WelcomeView v-if="chatHistory.length === 0" @select="useExamplePrompt" />

          <!-- 聊天记录 -->
          <ChatMessage 
            v-for="message in chatHistory" 
            :key="message.id" 
            :message="message" 
            @save="save" 
            @re-edit="(content) => { promptText = content }" 
          />
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
import { ref } from 'vue';
import PromptForm from '@/components/PromptForm.vue'; // 导入表单组件
import WelcomeView from '@/components/WelcomeView.vue';  // 导入欢迎组件
import ChatMessage from '@/components/ChatMessage.vue'; // 导入聊天消息组件
import platform from '@/utils/platform'; // 导入平台抽象工具
import { useWatermark } from '@/hooks/useWatermark'; // 导入水印钩子
import { useImageGenerator } from '@/hooks/useImageGenerator'; // 导入图片生成钩子

const { canvasWidth, canvasHeight, addWatermark } = useWatermark(); // 使用水印钩子

const chatHistory = ref([]); // 默认为空数组，不再从本地存储加载
const { loading, generate } = useImageGenerator(chatHistory, addWatermark); // 使用图片生成钩子
const promptText = ref(''); // 用于双向绑定 PromptForm 的值


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

  await generate(prompt);
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
  // #ifdef H5
  downloadForH5(url);
  return;
  // #endif

  try {
    // 判断是否为网络图片 (http/https 且非 http://usr/)
    // 真机上本地路径通常为 wxfile://，模拟器为 http://usr/
    const isNetworkUrl = (url.startsWith('http://') || url.startsWith('https://')) && !url.startsWith('http://usr/');

    if (isNetworkUrl) {
      await platform.saveImage(url);
    } else {
      await new Promise((resolve, reject) => {
        uni.saveImageToPhotosAlbum({
          filePath: url,
          success: resolve,
          fail: reject
        });
      });
    }
    uni.showToast({ title: '已保存到相册', icon: 'success' });
  } catch (e) {
    console.error('Save image failed:', e);
    
    // #ifdef MP-WEIXIN
    // 处理小程序权限拒绝的情况
    if (e.errMsg && (e.errMsg.includes('auth deny') || e.errMsg.includes('authorize:fail') || e.errMsg.includes('privacy'))) {
      uni.showModal({
        title: '权限提示',
        content: '保存图片需要您的相册授权，请前往设置开启或检查隐私协议',
        confirmText: '去设置',
        success: (res) => {
          if (res.confirm) {
            uni.openSetting();
          }
        }
      });
      return;
    }
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

</script>

<style scoped>


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

</style>

<!--
验收标准:
- 输入 prompt -> 触发 POST /api/generate -> 返回 URL -> 页面显示图片；
- 点击图片 -> 调用 platform.previewImage；
- 点击“保存” -> 调用 platform.saveImage（小程序需要授权），H5 点击“下载”触发 platform.h5Download。
-->
