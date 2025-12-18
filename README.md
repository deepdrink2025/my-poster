# 秒作图 - AI 艺术创作应用

**输入奇思妙想，即刻生成艺术作品。**

这是一个基于 `uni-app` 和 `Vue 3` 构建的跨平台 AI 作图应用。用户可以通过简单的文字描述，调用后端 AI 模型生成富有创意的艺术图片。项目前端界面简洁、交互流畅，支持多端发布，包括 H5 和微信小程序。

##  功能特性

- **AI 文本生成图片**：核心功能，输入任意描述性文本（Prompt），生成对应的图片。
- **聊天式交互界面**：以对话列表的形式展示历史生成记录，直观且易于追溯。
- **动态加载效果**：在等待图片生成时，提供多种有趣的加载文案和动画，提升用户体验。
- **图片预览与保存**：
  - 生成的图片会添加预览水印，引导用户保存。
  - 支持一键**保存无水印高清原图**到本地相册。
- **跨平台兼容**：基于 `uni-app` 开发，一套代码可发布到 H5、微信小程序等多个平台。
- **本地历史记录**：用户的对话和生成历史会自动保存在本地，下次打开时可恢复。
- **响应式布局**：界面适配不同尺寸的移动设备屏幕。

##  技术栈

- **前端框架**: Vue 3 (使用 Composition API 和 `<script setup>`)
- **跨端框架**: uni-app
- **状态管理**: Vue 3 `ref`
- **HTTP 请求**: `uni.request` (封装在 `src/utils/api.js`)
- **UI 组件**: uni-ui
- **代码风格**: Scoped CSS, Flexbox

##  项目启动

### 1. 环境准备

请确保您的开发环境已安装 Node.js (建议版本 >= 16) 和 HBuilderX。

### 2. 克隆项目

```bash
git clone https://gitee.com/feiji307/my-poster.git
cd my-poster
```

### 3. 安装依赖

```bash
npm install
# 或者
yarn install
```

### 4. 配置后端服务

本项目仅包含前端部分。您需要一个能够接收文本并返回图片（Blob 或临时文件路径）的后端 API。

请在 `src/utils/api.js` 文件中修改 `baseURL` 为您的后端服务地址。

```javascript
// src/utils/api.js
const baseURL = 'http://your-backend-api.com'; // <--- 修改这里
```

### 5. 运行项目

- **H5 模式**

  ```bash
npm run dev:h5
  ```

- **微信小程序模式**

  在 HBuilderX 中打开项目，点击顶部菜单栏的“运行” -> “运行到小程序模拟器” -> “微信开发者工具”。

## 📁 项目结构

```
my-poster/
├── src/
│   ├── components/
│   │   └── PromptForm.vue      # 底部输入框组件
│   ├── pages/
│   │   └── index/
│   │       └── index.vue       # 主页面（聊天、展示）
│   ├── static/                 # 静态资源（图标、Logo等）
│   ├── utils/
│   │   ├── api.js              # API 请求封装
│   │   └── platform.js         # 跨平台能力抽象（保存图片等）
│   ├── App.vue                 # 应用入口
│   ├── main.js                 # Vue 初始化入口
│   └── manifest.json           # uni-app 配置文件
├── .gitignore                  # Git 忽略配置
└── package.json                # 项目依赖
```

##  开源许可

本项目基于 MIT License 开源。