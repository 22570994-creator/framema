# 第三方来源

- `scripts/lib/storyboard.mjs`：来自 https://github.com/heygen-com/hyperframes 的 `skills/music-to-video/scripts/lib/storyboard.mjs`，下载于 2026-10-03，保留原始内容与同目录的 `LICENSE.hyperframes`（Apache-2.0）。对应来源快照的逐文件哈希在前期下载项目清单中，未把随后分支 HEAD 冒充历史 commit。
- HyperFrames 0.8.114：通过 npm/package-lock 安装，Apache-2.0；运行依赖的具体许可保留在各自包中。
- GSAP 3.14.2：通过 npm/package-lock 安装。复制到工程的 gsap.min.js 保留其原始版权与许可头；许可信息参见 https://gsap.com/standard-license/ 。
- Noto Sans SC：来自 https://github.com/google/fonts/tree/main/ofl/notosanssc ，字体随 Skill 提供，保留 assets/OFL.txt。
- Chrome for Testing：安装脚本下载 Google 官方固定版本，浏览器二进制不包含在 Skill ZIP 中。
- Node.js 22.20.0：安装脚本下载 nodejs.org 官方固定发行包，保留发行包内许可；不包含在 Skill ZIP 中。

演示配乐只在本机样片工程中使用，不包含在可安装 Skill 包中，也不推定获得公开发行授权。
