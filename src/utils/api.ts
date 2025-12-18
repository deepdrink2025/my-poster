// file: src/utils/api.ts
const USE_MOCK = false; // 关闭 mock，连接真实后端

// --- Token Management ---
const TOKEN_KEY = 'auth_token';

/**
 * 获取本地存储的 token
 */
const getToken = (): string | null => {
	// #ifdef MP-WEIXIN || H5
	return uni.getStorageSync(TOKEN_KEY);
	// #endif
	return null;
};

// 统一后端服务地址
const baseUrl = 'http://127.0.0.1:8000';

const api = {
	/**
	 * 设置 token
	 * @param token
	 */
	setToken: (token: string) => uni.setStorageSync(TOKEN_KEY, token),
  /**
   * 发起 POST 请求
   * @param path - 请求路径
   * @param body - 请求体
   * @param options - 请求选项，例如 { responseType: 'blob' }
   * @returns Promise<any>
   */
  async post(path: string, body: object, options?: { responseType?: string }): Promise<any> {
    // =============================
    // 内置 mock（H5 + 小程序都可用）
    // =============================
    if (USE_MOCK && path === '/api/generate') {
      const { prompt } = body as any;
      console.log('[MOCK] 收到 prompt:', prompt);

      // 返回一个随机图片 URL（海报模拟）
      return Promise.resolve({
        url: 'https://picsum.photos/800/1200?random=' + Math.random(),
      });
    }
    // #ifdef H5
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
		};
		const token = getToken();
		if (token) {
			headers['Authorization'] = `Bearer ${token}`;
		}
    try {
      // 在 H5 环境中，统一拼接 baseUrl
      const response = await fetch(baseUrl + path, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
 
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
 
      // 根据 options.responseType 决定如何解析响应
      if (options?.responseType === 'blob') {
        return await response.blob();
      }
 
      // 默认解析为 JSON
      return await response.json();
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
    // #endif

    // #ifdef MP-WEIXIN
    return new Promise((resolve, reject) => {
			const headers: Record<string, string> = {
				'Content-Type': 'application/json',
			};
			const token = getToken();
			if (token) {
				headers['Authorization'] = `Bearer ${token}`;
			}
      uni.request({
        url: baseUrl + path,
        method: 'POST',
        data: body,
				header: headers,
        timeout: 600000, // 增加超时时间为 10 分钟，给后端AI生成图片留出足够时间
        // 如果需要返回二进制数据，小程序需要设置为 arraybuffer
        responseType: options?.responseType === 'blob' ? 'arraybuffer' : 'text',
        success: (res) => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`Request failed with status code ${res.statusCode}`));
          } else {
            // 如果请求的是二进制数据 (responseType: 'blob')
            // 在小程序中，uni.request 会返回 ArrayBuffer
            // 我们需要将其写入临时文件，并返回文件路径，而不是创建 Blob
            if (options?.responseType === 'blob' && res.data instanceof ArrayBuffer) {
              // 小程序环境没有 Blob，需要将 ArrayBuffer 写入临时文件
              const fs = uni.getFileSystemManager();
              // 生成一个唯一的临时文件路径
              const filePath = `${wx.env.USER_DATA_PATH}/poster_${Date.now()}.png`;
              fs.writeFile({
                filePath: filePath,
                data: res.data,
                encoding: 'binary',
                success: () => {
                  // 成功后，返回临时文件路径。
                  // 调用方应该检查返回的是字符串路径（小程序）还是 Blob 对象（H5）
                  console.log('[api.ts] Binary data saved to temp file:', filePath);
                  resolve(filePath);
                },
                fail: (err) => reject(err),
              });
              return; // writeFile 是异步的，在此处返回，避免执行下面的 resolve
            }
            // 否则，正常返回数据（uni.request 会自动尝试解析 JSON）
            resolve(res.data);
          }
        },
        fail: (err) => {
          console.error('uni.request error:', err);
          reject(err);
        },
      });
    });
    // #endif
  },

	/**
	 * 微信小程序登录
	 * @returns Promise<void>
	 */
	async login(): Promise<void> {
		// #ifdef MP-WEIXIN
		return new Promise((resolve, reject) => {
			uni.login({
				provider: 'weixin',
				success: async (loginRes) => {
					try {
						const res = await this.post('/api/login', { code: loginRes.code });
						this.setToken(res.access_token);
						console.log('[api.ts] Login successful, token saved.');
						resolve();
					} catch (error) {
						reject(error);
					}
				},
				fail: (err) => reject(err),
			});
		});
		// #endif
  },
};

export default api;

/*
验收标准:
- H5 环境下 post('/api/generate', {prompt}) 返回解析的 JSON；
- MP-WEIXIN 环境下通过 uni.request 返回 JSON。
*/
