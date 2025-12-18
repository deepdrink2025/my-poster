<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import api from '@/utils/api';
onLaunch(() => {
  console.log("App Launch");
  // #ifdef MP-WEIXIN
    try {
      // 调用封装好的登录方法
      api.login();
      console.log('自动登录成功');
      // 这里可以接续处理登录成功后的逻辑，例如获取用户信息等
    } catch (error) {
      console.error('自动登录失败:', error);
      // 提示用户登录失败
      uni.showToast({
        title: '登录失败，请稍后重试',
        icon: 'none'
      });
    }
    // #endif
});
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});
</script>
<style lang="scss">
  /* 每个页面公共css */
</style>
