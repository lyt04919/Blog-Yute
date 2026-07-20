## 痛点：鱼和熊掌不可兼得？
在个人知识管理（PKM）领域，很多人（包括我）都喜欢一种“双核”工作流：
- **Notion**：用于高视角的项目管理、看板追踪、任务协作。
- **Obsidian**：用于深度的个人知识沉淀、双链漫游和离线写作。
理想状态下，我们希望在 Notion 的任务卡片中直接贴上 Obsidian 的笔记链接，点击就能瞬间跳转过去写代码或查阅资料。Obsidian 官方非常贴心地提供了 `obsidian://` 协议（URI）来实现这一点。
**但现实很骨感：** Notion 出于安全策略，**不支持（甚至会直接屏蔽）以 `obsidian://` 开头的自定义协议链接。**
这意味着你无法在 Notion 里愉快地点开 Obsidian 的笔记。为了跨越这道墙，我写了一个极简的纯静态中转站工具。
---
## 破局：Notion to Obsidian Redirector
思路其实非常简单：既然 Notion 只认 `http/https`，那我们就给它一个 HTTPS 链接。当浏览器打开这个 HTTPS 网页时，网页再通过 JavaScript 瞬间执行 `obsidian://` 跳转。
为了保证极速的加载体验和零维护成本，我将这个项目设计为**无任何框架依赖的单文件静态页面**，并托管在免费的 GitHub Pages 上。
[👉 项目源码地址 (GitHub)](https://github.com/lyt04919/obsidian-redirect)
### 核心实现逻辑
整个项目最核心的魔法就在于 `index.html` 中的几十行 JavaScript 代码。它的工作流程如下：
1. **解析参数**：从访问的 URL 中提取 `vault`（仓库名）和 `file`（文件名）。
2. **URL 编码**：为了完美支持带有空格或中文字符的文件名（这在笔记中太常见了），使用 `encodeURIComponent()` 对参数进行安全编码。
3. **自动跳转**：拼接完整的 URI，并通过修改 `window.location.href` 实现秒级拉起 Obsidian。
4. **防拦截降级策略**：现代浏览器有时会拦截未经用户交互的自动跳转。因此，如果跳转失败，页面中间会显示一个优雅的“点击这里打开 Obsidian”按钮作为后备方案。
```javascript
// 核心跳转逻辑解析
const urlParams = new URLSearchParams(window.location.search);
const vault = urlParams.get('vault');
const file = urlParams.get('file');
// 安全编码，完美支持中文与空格
const encodedVault = encodeURIComponent(vault);
const encodedFile = encodeURIComponent(file);
// 构造 Obsidian 专属协议
const obsidianUri = `obsidian://open?vault=${encodedVault}&file=${encodedFile}`;
// 执行秒级跳转
window.location.href = obsidianUri;
```
---
## 进阶玩法：如何一键生成专属链接？
部署好网页后，我只需要在 Notion 里输入：
`https://lyt04919.github.io/obsidian-redirect/?vault=Notes&file=Inbox/Idea`
就能成功跳转。
**但是，每次手动拼接这么长一串链接简直反人类。** 为了将这套工作流的体验拉满，我用 Mac 自带的“快捷指令 (Shortcuts)”实现了一键生成。
### Mac 快捷指令“一键洗白”方案
1. 在 Mac 快捷指令里新建一个指令。
2. 依次添加三个动作：
   - **获取剪贴板**
   - **替换文本**：将剪贴板里的 `obsidian://open?` 替换为 `https://lyt04919.github.io/obsidian-redirect/?`
   - **拷贝至剪贴板**
3. 给这个指令绑定一个全局热键（比如 `Option + Cmd + C`）。
**丝滑的终极体验：**
现在，我只需要在 Obsidian 里右键想要关联的笔记，点击自带的 `复制 Obsidian URL`，然后随手按一下 `Option + Cmd + C`，剪贴板里的内容就被“洗”成了 Notion 专用链接。切回 Notion，直接粘贴，一气呵成！
## 总结
有时候，解决跨平台软件生态割裂的问题，并不需要庞大的后端服务或复杂的插件。一个纯静态的 HTML 页面，加上一点操作系统的自动化小巧思，就能让你的 PKM 生产力得到巨大的飞跃。
如果你也在被 Notion 和 Obsidian 的链接问题困扰，欢迎直接 Fork 我的仓库部署一套属于你自己的中转站！
