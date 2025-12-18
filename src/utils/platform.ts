// file: src/utils/platform.ts

const platform = {
  /**
   * 保存图片到相册
   * @param {string} url - 图片的URL
   * @returns {Promise<void>}
   */
  saveImage(url: string): Promise<void> {
    // #ifdef MP-WEIXIN
    return new Promise((resolve, reject) => {
      uni.downloadFile({
        url: url,
        success: (res) => {
          if (res.statusCode === 200) {
            uni.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => {
                resolve();
              },
              fail: (err) => {
                if (err.errMsg.includes('auth deny')) {
                  reject(new Error('用户拒绝了相册授权'));
                } else {
                  reject(new Error('保存图片失败: ' + (err.errMsg || '未知错误')));
                }
              },
            });
          } else {
            reject(new Error('下载文件失败: ' + res.errMsg));
          }
        },
        fail: (err) => {
          reject(new Error('下载文件失败: ' + (err.errMsg || '网络错误')));
        },
      });
    });
    // #endif

    // #ifdef H5
    // 在H5平台，saveImage的行为与h5Download相同
    return platform.h5Download(url);
    // #endif
  },

  /**
   * 预览图片
   * @param {string[]} urls - 需要预览的图片http链接列表
   */
  previewImage(urls: string[]): void {
    if (!urls || urls.length === 0) {
      return;
    }
    // #ifdef MP-WEIXIN
    uni.previewImage({
      urls: urls,
      current: urls[0],
    });
    // #endif

    // #ifdef H5
    window.open(urls[0], '_blank');
    // #endif
  },

  /**
   * H5环境下触发浏览器下载
   * @param {string} url - 图片的URL
   * @returns {Promise<void>}
   */
  h5Download(url: string): Promise<void> {
    // #ifdef H5
    return new Promise((resolve, reject) => {
      try {
        const a = document.createElement('a');
        a.href = url;
        // 从URL中提取文件名，或使用默认名
        const fileName = url.split('/').pop()?.split('?')[0] || `poster_${Date.now()}.png`;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        resolve();
      } catch (e: any) {
        console.error('H5 download failed:', e);
        reject(new Error('创建下载链接失败: ' + e.message));
      }
    });
    // #endif

    // #ifdef MP-WEIXIN
    // 小程序环境不实现此方法，直接返回成功
    return Promise.resolve();
    // #endif
  },
};

export default platform;

/*
验收标准:
- 在小程序端 saveImage 会下载并尝试保存到相册（需要用户授权）；
- H5 端 h5Download 会触发浏览器下载。
*/
