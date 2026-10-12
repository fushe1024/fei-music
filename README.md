<p align="center">
  <img src="public/assets/logo.png" alt="菲菲音乐" width="240" />
</p>

<h1 align="center">菲菲音乐</h1>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-2b7fff.svg" alt="License: MIT" /></a>
  <img src="https://img.shields.io/badge/React-19-61dafb.svg" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-6-3178c6.svg" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8-646cff.svg" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Video.js-10-ff6b35.svg" alt="Video.js 10" />
</p>

<p align="center">一个用对话写出来的桌面端音乐 Web 应用 · Vibe Coding 实战练手项目</p>

## 简介

菲菲音乐是一个桌面端的在线音乐播放器：浏览推荐歌单、歌单分类、排行榜与歌手，搜索歌曲与 MV，
并直接在页面里播放音乐和 MV，配套全屏播放页、逐字歌词、播放列表面板与三种播放模式。

这个项目也是一次 **Vibe Coding** 的实战练习 —— 从一个想法开始，需求梳理、界面还原、交互打磨与
问题排查都是通过与 AI 持续对话、小步迭代完成的，目的是熟悉这种协作式的开发方式，
并在这个过程中加深对 React 前端工程的理解。所以它更像一份**练习作品**，而不是追求生产可用的产品。

## 功能特性

- **推荐**：推荐歌单、新歌速递、新碟上架，两个「更多」入口进入「新歌新碟」页
- **歌单**：热门标签与更多分类面板筛选、上拉分页，卡片进入歌单详情
- **排行榜**：全部榜单渲染成渐变卡片，封面缺失时用内置色板兜底
- **歌手**：地区 / 性别 / 热门 / `#` / A–Z 索引，上拉加载；歌手详情展示头像、单曲数与热门单曲
- **MV**：推荐 / 最新 / 独家推荐 / 全部四段，支持地区、类型、排序筛选与上拉加载
- **搜索**：头部输入即时建议（命中词高亮、清空、键盘选择），结果页五个 tab：单曲 / 歌单 / 专辑 / 歌手 / 视频
- **播放**：播放条与全屏播放页、逐字歌词高亮、播放列表面板、顺序 / 单曲循环 / 随机三种模式
- **体验细节**：骨架屏、空态与错误重试、VIP 标注、轻提示、主题一键换色

## 技术栈

| 方向     | 选型                                                       |
| -------- | ---------------------------------------------------------- |
| 构建     | Vite 8 + React 19 + TypeScript                             |
| 路由     | react-router 7 Data 模式（`createBrowserRouter`）          |
| 全局状态 | zustand（播放状态、队列、播放模式）                        |
| 组件库   | shadcn/ui（Radix UI + Tailwind v4 + CVA）                  |
| 样式     | SCSS（设计变量 + BEM 命名）                                |
| 图标     | lucide-react                                               |
| 视频播放 | Video.js 10（React 包为 `@videojs/react`）                 |
| 代码检查 | oxlint                                                     |

## 快速开始

环境要求：Node.js 18+、pnpm。

```bash
# 安装依赖
pnpm install

# 启动开发服务（默认 http://localhost:5173）
pnpm dev

# 类型检查 + 打包
pnpm build

# 代码检查
pnpm lint
```

开发环境的请求默认走本地代理，需要后台 API 服务先跑起来（见下一节），
接口地址等配置在根目录 `.env`，改完需要重启 dev server。

> 若 pnpm 提示「已忽略构建脚本」，确认 `pnpm-workspace.yaml` 里的 `allowBuilds`
> 允许 `@parcel/watcher` 执行安装脚本即可。

## 后台 API 服务（本地开发）

本项目只包含前端，需要自备后台 API 服务。本地开发使用网易云音乐 NodeJS 版 API：

```bash
# 下载 NeteaseCloudMusicApi
git clone --depth=1 https://github.com/Binaryify/NeteaseCloudMusicApi

# 进入 NeteaseCloudMusicApi 后台服务目录
cd NeteaseCloudMusicApi

# 安装依赖
npm install

# 运行后台 api 服务 访问 http://localhost:3000
node app.js
```

服务启动后，把项目 `.env` 里的代理目标改成本地服务并重启 dev server：

```ini
VITE_API_PROXY_TARGET=http://localhost:3000
```

| 变量                    | 说明                                        |
| ----------------------- | ------------------------------------------- |
| `VITE_API_BASE_URL`     | 前端请求前缀，开发环境固定 `/api`（走代理） |
| `VITE_API_PROXY_TARGET` | 开发代理目标，本地开发指向上面的服务地址    |
| `VITE_API_TIMEOUT`      | 请求超时（毫秒）                            |
| `VITE_REAL_IP`          | 部分部署环境要求的来源 IP 参数              |

## 开源协议

本项目基于 [MIT License](LICENSE) 开源，Copyright © 2026 Cookie。

## 免责声明

### 关于本项目

本项目是一个 **Vibe Coding** 的练手实战项目，通过与 AI 对话协作、反复迭代的方式完成，
目的是锻炼这种开发方式并提升前端技术水平。项目不提供任何形式的服务承诺，请勿用于生产环境。

### 关于内容与版权

- 本项目**不提供任何音频的存储、上传、下载或贩卖服务**，仓库内不含任何音频文件；
- 所有音频、MV 与图片内容均由**网易云音乐的第三方 API** 提供，仅供**个人学习研究**使用；
- 相关版权归原始平台及权利人所有，**严禁用于任何商业用途及非法用途**；
- 请在使用中遵守相关法律法规；建议试听后及时删除本地缓存，并支持正版音乐。

### 关于责任

- 使用本项目造成的任何纠纷、责任或损失，由使用者自行承担；
- 本项目开发者不对因使用本项目而产生的任何直接或间接责任承担责任，
  并保留追究使用者违法行为的权利；
- 本项目使用了网易云音乐的第三方 API 服务，对于该第三方 API 服务造成的任何问题，
  本项目开发者不承担责任。

### 请确认

请在使用本项目之前仔细阅读以上免责声明，并确保你已完全理解并接受其中的所有条款和条件。
如果你不同意或无法遵守这些规定，**请不要使用本项目**。

## 反馈与贡献

这是一个学习性质的项目，欢迎通过 Issue 交流想法、指出问题。
提交代码前请先运行 `pnpm lint` 与 `pnpm build`。
