# 创作与分镜

适配器采用上游 `parseStoryboard`。必需格式如下，数字帧字段是时间权威来源；`duration` 供上游读取并需与帧数一致。

```markdown
---
format: 1280x720
fps: 30
total_frames: 450
message: 这条片子最想传达的一句话
strategy: showcase
material: vector
accent: #d67549
font: assets/NotoSansSC.ttf
gsap: assets/gsap.min.js
audio: assets/audio.wav
audio_required: true
sync_required: false
---

## Frame 1 — 开场
- start_frame: 0
- frames: 150
- duration: 5s
- transition_in: cut
- src: index.html
- status: animated
- scene: 先让观众看清主题
- headline: 下一站，|春天。
- subline: 一封写给新季节的声音来信
- eyebrow: 声音 / 新的开始
- tag: 概念样片
- footer: 把下一站，交给春天。
```

其余场景接续上一场景的结束帧，合计等于 total_frames。起始帧包含、结束帧不包含。支持正偶数画幅、整数帧率到 60、总时长到 180 秒；这只是适配器输入边界，不是所有规格均已渲染验证。

策略 `showcase` 为唱片主题展示，`evolution` 从印刷唱片到技术线图再到数字频谱，`paper` 是统一纸张材质的便捷预设。可通过 `material: paper` 将纸张约束用于其他策略；需要变化时用文案、阶段标签和构图表达，不把“换背景”当作故事发展。v0.1 模板构图固定，超出模板语义时应扩展代码而不是伪称自由导演已完成。

标题用 `|` 分为最多三行，每行最多 14 个 Unicode 字符，副文案最多 42 字；这些是宽松容量上限，实际适配仍以浏览器测量和审图为准。中文与英文字符宽度不同；不要依赖字符计数证明不会溢出。

模板中的文案、色彩、材质都在 Markdown 修改。编译器会转义 HTML 内容，禁止把标题当 HTML 执行。资源只能是工程内现存文件，远程资产先下载并记录来源，禁止渲染时实时取材。

音频支持 `audio: none`。需要同步时增加 `audiomap: audiomap.json` 并设 `sync_required: true`，文件为 `{ "fps":30, "anchors":[{"frame":75,"audio_sec":2.5}] }`。锚点必须来自实际音频分析或人工确认，不能从文案长度猜测。提供锚点只验证规划精度，不代表歌词口型同步。

编辑后重新生成全部 HTML。v0.1 不宣称增量视频重渲染；保留旧版本以比较是否出现无关改动。
