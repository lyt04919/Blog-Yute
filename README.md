# YYsuni Blog (2025-blog)

> 极简主义个人数字花园与内容创作平台 | A minimalist personal digital garden & web application built with Next.js 16, React 19, and Cloudflare / Vercel Edge Architecture.
>
> 🌐 **在线演示**：[https://www.yysuni.com](https://www.yysuni.com)

---

## 目录

- [一、项目架构图](#一项目架构图)
- [二、核心模块与 API 说明](#二核心模块与-api-说明)
  - [2.1 核心功能模块](#21-核心功能模块)
  - [2.2 核心 API 接口说明](#22-核心-api-接口说明)
- [三、本地开发与部署指南](#三本地开发与部署指南)
  - [3.1 环境要求与依赖安装](#31-环境要求与依赖安装)
  - [3.2 环境变量配置](#32-环境变量配置)
  - [3.3 本地开发运行](#33-本地开发运行)
  - [3.4 GitHub App 配置流程](#34-github-app-配置流程)
  - [3.5 线上部署指南（Cloudflare / Vercel）](#35-线上部署指南cloudflare--vercel)
- [四、技术栈选型说明](#四技术栈选型说明)

---

## 一、项目架构图

`YYsuni Blog` 采用无数据库（Database-less）、基于 Git-as-a-CMS 的 Serverless & Edge 混合架构。系统前台提供极致性能与平滑交互的阅读体验，后台采用基于 GitHub App 的 JWT/Token 鉴权完成内容实时发布与云端同步。

### 1. 系统总体架构与数据流图

```mermaid
flowchart TD
    subgraph Client [客户端 - User & Admin Browser]
        UI[Next.js App Router 前台界面]
        SearchEngine[Fuse.js 客户端全文检索]
        Editor[CodeMirror & MDXEditor 编辑器]
        ZustandStore[Zustand 全局状态/主题/鉴权管理]
    end

    subgraph EdgeServer [Serverless & Edge 服务层]
        NextServer[Next.js Server Component & Route Handlers]
        TokenService["/api/auth/github-token (GitHub App Auth)"]
        MediaProxy["/api/upload & /api/image-proxy (媒体处理)"]
        ExternalProxy["/api/tmdb / /api/steam / /api/apple-music"]
    end

    subgraph DataCMS [ Git 存储与 CMS 引擎]
        GitRepo[GitHub Repository (Markdown / JSON Data)]
        GitAPI[GitHub REST API (Contents & Git Trees)]
    end

    subgraph Services [第三方 API 与 Edge CDN]
        Cloudflare[Cloudflare Workers / OpenNext Edge]
        Vercel[Vercel Serverless Network]
        TMDB[TMDB Movie API]
        Steam[Steam Web API]
        AppleMusic[Apple Music API]
    end

    UI --> ZustandStore
    UI --> SearchEngine
    Editor --> TokenService
    TokenService -->|JWT 签名 & Auth| GitAPI
    Editor -->|PutFile / Git Batch Commit| GitAPI
    GitAPI -->|Trigger CI/Build| GitRepo
    GitRepo --> NextServer
    NextServer --> Cloudflare
    NextServer --> Vercel
    ExternalProxy --> TMDB & Steam & AppleMusic
    MediaProxy --> GitAPI
```

### 2. 内容发布与 GitHub 自动化 commit 流程

```mermaid
sequenceDiagram
    autonumber
    actor Admin as 管理员 / 作者
    participant FE as 前端编辑器 (Write / Vault)
    participant AuthAPI as /api/auth/github-token
    participant GH as GitHub REST API
    participant CI as Cloudflare / Vercel CI

    Admin->>FE: 输入访问口令登录
    FE->>AuthAPI: POST { password }
    AuthAPI->>AuthAPI: 生成 App JWT 秘钥签名
    AuthAPI->>GH: 请求 Installation Access Token
    GH-->>AuthAPI: 返回临时 Access Token (1小时有效)
    AuthAPI-->>FE: 缓存 Token 至 SessionStorage

    Admin->>FE: 撰写/修改文章或修改数据 JSON
    Admin->>FE: 点击提交发布
    FE->>GH: 调用 Git API (createTree / createCommit / updateRef)
    GH-->>FE: 返回 Commit SHA 成功响应
    FE-->>Admin: 提示发布成功
    GH->>CI: Webhook 触发自动构建部署
```

---

## 二、核心模块与 API 说明

### 2.1 核心功能模块

| 模块名称 | 对应路由 / 目录 | 功能描述 |
| :--- | :--- | :--- |
| **首页与 Bento 展示** | `src/app/(home)` | 问候卡片、动态简介、Bento 风格导航卡片、动态配置抽屉及精美无边框视觉交互 |
| **博客文章系统** | `src/app/blog` <br> `src/app/blog/[id]` | Markdown 文章展示、标签筛选、分类路由、Toc 目录高亮、 Fuse.js 模糊搜索 (`Ctrl+K`) |
| **数字花园 / 收藏库** | `src/app/favorite` <br> `src/app/vault` | 整合书籍（Books）、影视（TMDB）、游戏（Steam）、音乐（Apple Music）与足迹地图（Leaflet 交互地图） |
| **项目与作品展示** | `src/app/projects` | 展示个人开源项目、技术栈标签、演示链接及 GitHub 实时状态 |
| **在线在线编辑器** | `src/app/write` | 支持 Markdown 代码高亮、拖拽/剪贴板图片上传自动提交至 GitHub 仓库、实时预览 |
| **后台控制台与 Vault 数据编辑** | `src/app/admin` <br> `src/app/vault/*` | 可视化管理与修改站点 JSON 配置文件（书籍、影音、足迹、片段等） |
| **小工具与实验场** | `src/app/image-toolbox` <br> `src/app/clock` <br> `src/app/pictures` | 图片格式转换工具（HEIC 转 JPEG）、翻页时钟、拍立得风格图床与相册 |
| **分享卡片生成引擎** | `src/components/share-card.tsx` | 将文章摘录一键渲染为高度定制化的金句分享图，支持下载与剪贴板复制 |

### 2.2 核心 API 接口说明

项目所有 API Handler 位于 `src/app/api/` 目录中：

| Endpoint 路径 | 请求方式 | 作用与逻辑说明 | 鉴权要求 |
| :--- | :--- | :--- | :--- |
| `/api/auth/github-token` | `POST` | 校验管理员密码，使用 GitHub App 私钥通过 `jsrsasign` 签署 JWT，换取免 PAT 的 GitHub 写入 Token | 管理员口令 |
| `/api/save-data` | `POST` | 接收 JSON 或文本内容，直接调用 GitHub API 更新远程仓库中指定位置的文件 | GitHub Token |
| `/api/upload` | `POST` | 处理上传的图片文件（包含 HEIC 格式转换与压缩），打包为 Base64 并上传 Commit 至仓库图片目录 | GitHub Token |
| `/api/admin/content` | `GET` / `POST` | 读取与保存站点全局配置 `site-content.json` 与卡片样式配置 | 本地/Token |
| `/api/save-blog-local` | `POST` | 在开发模式（Development）下直接将文章写入本地 `public/posts/` 目录 | 本地开发环境 |
| `/api/delete-blog-local` | `POST` | 本地开发模式下删除指定的本地文章文件 | 本地开发环境 |
| `/api/tmdb` | `GET` | 代理请求 TMDB API 检索影视剧海报、评分及简介信息 | 公开 |
| `/api/steam` | `GET` | 代理请求 Steam Web API 获取个人游戏时长、成就及近期游玩库 | 公开 |
| `/api/apple-music-search` | `GET` | 查询 Apple Music 试听音乐元数据与专辑封面 | 公开 |
| `/api/og` | `GET` | 基于 Edge HTML/Canvas 动态生成文章的 Open Graph 社交分享图片 | 公开 |
| `/api/parse-video-url` | `GET` | 解析 Bilibili / YouTube 视频 URL 获取元信息与内嵌播放器代码 | 公开 |
| `/api/image-proxy` | `GET` | 跨域图片代理，解决防盗链及第三方图片无法正常展示问题 | 公开 |

---

## 三、本地开发与部署指南

### 3.1 环境要求与依赖安装

- **Node.js**: `>= 18.18.0`（推荐 `v20+`）
- **包管理器**: `pnpm` 或 `npm`

```bash
# 克隆仓库
git clone https://github.com/lyt04919/myBlog.git
cd myBlog

# 安装依赖
npm install --legacy-peer-deps
```

### 3.2 环境变量配置

在项目根目录下创建 `.env.local` 文件，配置如下参数：

```env
# ===== GitHub 仓库配置 =====
NEXT_PUBLIC_GITHUB_OWNER=lyt04919
NEXT_PUBLIC_GITHUB_REPO=myBlog
NEXT_PUBLIC_GITHUB_BRANCH=main

# ===== GitHub App 授权配置 =====
NEXT_PUBLIC_GITHUB_APP_ID=123456
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"

# ===== 网站安全口令 =====
BLOG_PASSWORD=你的管理员密码

# ===== 第三方 API 密钥（可选） =====
TMDB_API_KEY=你的_tmdb_api_key
STEAM_API_KEY=你的_steam_api_key
```

### 3.3 本地开发运行

```bash
# 启动本地开发服务器（使用默认 2025 端口）
npm run dev

# 手动构建 SVG 图标索引（新增 SVG 图标时执行）
npm run svg
```

启动成功后，浏览器访问：[http://localhost:2025](http://localhost:2025)。

---

### 3.4 GitHub App 配置流程

为了支持在线写入文章、上传图片与管理数据，而无需暴露个人 GitHub Access Token，推荐配置 GitHub App：

1. 打开 GitHub -> **Settings** -> **Developer Settings** -> **GitHub Apps** -> **New GitHub App**。
2. 填写应用名称及 Homepage URL（填你的博客域名即可）。
3. 取消勾选 **Webhook** 中的 Active 选项（如不需要接收事件通知）。
4. 在 **Permissions** 权限设置中：
   - `Repository permissions` -> `Contents`: 选择 **Read & write**。
5. 点击 **Create GitHub App** 完成创建，保存页面的 **App ID**。
6. 在页面下方点击 **Generate a private key** 下载 `.pem` 私钥文件。
7. 将 GitHub App **Install** 安装到你的博客仓库中。
8. 将 `App ID` 填入 `NEXT_PUBLIC_GITHUB_APP_ID`，将 `.pem` 内容填入 `GITHUB_PRIVATE_KEY` 环境变量。

---

### 3.5 线上部署指南（Cloudflare / Vercel）

#### 选项 A：使用 Cloudflare Workers / Pages (OpenNext) 部署（推荐）

本项目已针对 OpenNext Cloudflare 进行了适配：

```bash
# 构建 Cloudflare 工件
npm run build:cf

# 本地预览 Cloudflare Worker
npm run preview

# 部署至 Cloudflare Workers
npm run deploy
```

> **注意**：在 Cloudflare Dashboard 中，需在 Worker 设置中将环境变量（`GITHUB_PRIVATE_KEY`、`BLOG_PASSWORD` 等）添加为密钥。

#### 选项 B：使用 Vercel 一键部署

1. 将仓库 Fork / 导入至你的 GitHub 账号。
2. 在 Vercel 中 **Import Project**。
3. 在 **Environment Variables** 中设置 `NEXT_PUBLIC_GITHUB_OWNER`、`NEXT_PUBLIC_GITHUB_REPO`、`NEXT_PUBLIC_GITHUB_APP_ID` 及 `GITHUB_PRIVATE_KEY`。
4. 点击 **Deploy**，构建完成后即可自动生成 HTTPS 域名。

---

## 四、技术栈选型说明

| 层级 / 维度 | 选用技术 / 库 | 选型考量与优势 |
| :--- | :--- | :--- |
| **应用框架** | **Next.js 16 (App Router)** | 利用最新的 React 19 Server Components 与 Dynamic Route Handlers，兼顾极速服务端渲染 (SSR) 与静态生成 (SSG)。 |
| **核心 UI 库** | **React 19 + TypeScript** | 提供严格的类型安全保护与并发渲染能力，构建高度可复用的复杂组件。 |
| **样式与设计系统** | **Tailwind CSS v4 + LightningCSS** | 遵照 *The Minimalist Atelier* 设计规范，基于 Token 控制对比度与原生 Dark Mode；Tailwind v4 提供极高的编译效率。 |
| **动画与交互** | **Framer Motion + GSAP + Lenis** | 结合 Framer Motion 的声明式 UI 动画、GSAP 的复杂时间轴动画与 Lenis 平滑滚动，带来媲美原生 App 的沉浸式微交互体验。 |
| **富文本与代码编辑** | **CodeMirror 6 + MDXEditor** | 针对 Markdown 语法深度定制，响应迅速，支持代码块高亮、自定义快捷键及图片拖拽上传。 |
| **搜索与索引引擎** | **Fuse.js** | 轻量级客户端模糊搜索算法，文章索引在编译/加载阶段载入，无需依赖额外的 Elasticsearch 或 Algolia 检索服务。 |
| **文档渲染引擎** | **Marked + KaTeX + Shiki** | `Marked` 提供极致的高速 Markdown 解析；`Shiki` 基于 VS Code 的 TextMate 语法提供精准代码高亮；`KaTeX` 负责 LaTeX 数学公式渲染。 |
| **数据持久化 (CMS)** | **GitHub REST API + GitHub App JWT** | Git-as-a-CMS 理念：无数据库设计，数据完全版本控制化，零数据库维护成本与安全风险。 |
| **边缘部署方案** | **@opennextjs/cloudflare + Vercel** | 支持 Cloudflare Edge Worker 全球边缘部署，保证全球极低延迟访问与高可用性。 |

---

## Star History

<a href="https://www.star-history.com/#lyt04919/myBlog&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=lyt04919/myBlog&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=lyt04919/myBlog&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=lyt04919/myBlog&type=date&legend=top-left" />
 </picture>
</a>

---

*Copyright © 2025-present YYsuni. Released under the [MIT License](LICENSE).*
