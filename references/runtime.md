# 运行环境

第三方来源见 [第三方说明](third-party.md)。

在 Skill 目录执行 `npm ci --no-audit --no-fund`，按 package-lock 安装；Node 22+，PATH 需要 FFmpeg/FFprobe。不自动升级 HyperFrames。

本机发现 Node 24.12.0 下渲染进程出现 0xC0000409 原生异常退出。已验证的渲染组合使用隔离的 Node 22.20.0：运行 `node scripts/setup-node.mjs` 下载官方发行包并检查 SHA256，写入 runtime.local.json；不替换系统 Node。控制脚本可由系统 Node 运行，HyperFrames 子进程使用这个固定版本。`MOTION_NODE_PATH` 可显式覆盖，改动后需重新验证。

运行 `node scripts/setup-browser.mjs` 安装固定的 Chrome Headless Shell 152.0.7977.30 并生成 `runtime.local.json`。也可提供 `HYPERFRAMES_BROWSER_PATH`；这个环境变量优先于本地配置。浏览器二进制不随 Skill ZIP 打包。

普通 Windows Chrome 的 `--version` 可能无法满足 HyperFrames 编码前探测，即便预览可用。使用 Headless Shell 解决，不要跳过渲染器检查。保持该二进制固定，使用 `node scripts/preflight.mjs <OUTPUT_JSON>` 记录 Node、HyperFrames、GSAP、浏览器、FFmpeg、字体与锁文件校验值。

所有辅助程序以参数数组启动且设置 windowsHide，不依赖 Bash、Homebrew 或全局 npm 包。中文和空格路径需要在 shell 中整体引用。

字体 Noto Sans SC 来自 google/fonts，SIL OFL，随包保留 OFL.txt。上游 Markdown 解析器副本与 Apache-2.0 许可证在 scripts/lib。GSAP 来源和许可随 npm 包保留，具体使用以包内许可为准。用户配乐不随 Skill 包分发。

运行日志存项目 reports。模板目前是单 HTML 的内嵌场景，HyperFrames 可能提示拆成 sub-composition 以改善 Studio 时间轴层级；这不影响已验证的输出，但不能声称实现了完整 Studio 可视化编辑工作流。
