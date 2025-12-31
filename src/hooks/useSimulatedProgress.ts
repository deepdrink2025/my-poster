export function useSimulatedProgress() {
  let intervalId: number | null = null;

  /**
   * 启动进度模拟
   * @param onTick - 每次回调，返回当前进度和文案
   */
  const startSimulation = (
    onTick: (progress: number, text: string) => void
  ) => {
    let currentProgress = 0;
    // 防止重复启动
    stopSimulation();

    intervalId = setInterval(() => {
      // 模拟算法：前期快，后期慢，无限逼近 99%
      const remaining = 99 - currentProgress;
      const increment = Math.max(0.02, remaining * 0.004);
      currentProgress = Math.min(99, currentProgress + increment);

      // 根据进度计算文案
      let text = '';
      if (currentProgress < 20) text = '正在解析您的奇思妙想...';
      else if (currentProgress < 40) text = '正在构思画面构图...';
      else if (currentProgress < 60) text = '正在混合色彩与光影...';
      else if (currentProgress < 80) text = 'AI 正在挥洒细节...';
      else text = '正在进行最后的润色...';

      onTick(Math.floor(currentProgress), text);
    }, 200);
  };

  const stopSimulation = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  return { startSimulation, stopSimulation };
}