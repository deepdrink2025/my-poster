import { ref } from 'vue';
import api from '@/utils/api';
import { useSimulatedProgress } from './useSimulatedProgress';

// 定义消息类型接口（根据实际情况调整）
interface Message {
  id: number;
  role: 'user' | 'assistant';
  type: 'text' | 'loading' | 'image' | 'error';
  content: string;
  progress?: number;
  originalContent?: string;
}

export function useImageGenerator(
  chatHistory:  import('vue').Ref<Message[]>,
  addWatermark: (url: string) => Promise<string>
) {
  const loading = ref(false);
  const { startSimulation, stopSimulation } = useSimulatedProgress();

  /**
   * 生成图片的核心业务逻辑
   */
  const generate = async (prompt: string) => {
    if (!prompt) return;

    loading.value = true;
    uni.setKeepScreenOn({ keepScreenOn: true });

    // 1. 添加用户消息
    chatHistory.value.push({
      id: Date.now(),
      role: 'user',
      type: 'text',
      content: prompt,
    });

    // 2. 添加 AI 加载中消息
    const assistantMessageId = Date.now() + 1;
    chatHistory.value.push({
      id: assistantMessageId,
      role: 'assistant',
      type: 'loading',
      content: '正在解析您的奇思妙想...',
      progress: 0,
    });

    // 启动模拟进度条
    startSimulation((progress, text) => {
      const index = chatHistory.value.findIndex(m => m.id === assistantMessageId);
      if (index !== -1 && chatHistory.value[index].type === 'loading') {
        const msg = chatHistory.value[index];
        msg.progress = progress;
        msg.content = text;
      }
    });

    try {
      // 创建最小延迟，防止请求太快导致动画一闪而过
      const minDelay = new Promise(resolve => setTimeout(resolve, 1500));

      // 发起请求
      const [res] = await Promise.all([
        api.post('/api/generate', { prompt }, { responseType: 'blob' }),
        minDelay
      ]);

      if (!res) throw new Error('后端未返回有效数据');

      // 处理结果
      const index = chatHistory.value.findIndex(m => m.id === assistantMessageId);
      if (index !== -1) {
        let originalImageUrl = '';

        // #ifdef H5
        if (res instanceof Blob) {
          originalImageUrl = URL.createObjectURL(res);
        }
        // #endif

        // #ifdef MP-WEIXIN
        if (typeof res === 'string') {
          originalImageUrl = res;
        }
        // #endif

        // 添加水印
        const watermarkedUrl = await addWatermark(originalImageUrl);

        // 更新消息为图片
        chatHistory.value[index] = {
          ...chatHistory.value[index],
          type: 'image',
          content: watermarkedUrl,
          originalContent: originalImageUrl
        };
      }
    } catch (e: any) {
      console.error('API request failed:', e);
      const index = chatHistory.value.findIndex(m => m.id === assistantMessageId);
      if (index !== -1) {
        chatHistory.value[index] = {
          ...chatHistory.value[index],
          type: 'error',
          content: e.message || '生成图片失败，请稍后再试'
        };
      }
    } finally {
      stopSimulation();
      loading.value = false;
      uni.setKeepScreenOn({ keepScreenOn: false });
    }
  };

  return {
    loading,
    generate
  };
}