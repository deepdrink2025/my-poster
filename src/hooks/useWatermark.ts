import { ref, nextTick, getCurrentInstance } from 'vue';

export function useWatermark() {
  const canvasWidth = ref<number>(1);
  const canvasHeight = ref<number>(1);
  // 获取当前组件实例，用于 CanvasContext
  // 注意：必须在 setup() 中同步调用
  const instance = getCurrentInstance();

  /**
   * 给图片添加水印
   * @param {string} originalUrl - 原始图片地址
   * @param {string} canvasId - Canvas ID
   * @returns {Promise<string>} - 返回带水印的临时图片地址
   */
  const addWatermark = async (originalUrl: string, canvasId: string = 'watermarkCanvas'): Promise<string> => {
    try {
      // 1. 获取图片信息
      const imageInfo = await new Promise<UniApp.GetImageInfoSuccessData>((resolve, reject) => {
        uni.getImageInfo({ src: originalUrl, success: resolve, fail: reject });
      });

      const { width, height, path: imagePath } = imageInfo;
      canvasWidth.value = width;
      canvasHeight.value = height;

      // 等待 Canvas 尺寸更新
      await nextTick();
      // 增加延时：UniApp View 层更新可能滞后，仅 nextTick 有时不够，导致 Canvas 尺寸未生效就开始绘制
      await new Promise(resolve => setTimeout(resolve, 200));

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
      return await new Promise<string>((resolve, reject) => {
        ctx.draw(false, () => {
          // 增加延时：确保绘制指令在 Native 层完全执行完毕后再导出，防止导出空白
          setTimeout(() => {
            uni.canvasToTempFilePath({
              canvasId,
              x: 0, y: 0, width, height, destWidth: width, destHeight: height,
              success: (res) => resolve(res.tempFilePath),
              fail: reject
            }, instance);
          }, 100);
        });
      });
    } catch (error) {
      console.error('添加水印失败:', error);
      // 如果添加水印失败，直接返回原始图片URL，避免流程中断
      return originalUrl;
    }
  };

  return {
    canvasWidth,
    canvasHeight,
    addWatermark
  };
}