# 自由工程合约

自由工程通过 project.json 识别；没有它的旧工程继续使用 STORYBOARD.md 模板。init-free 只建立最小可运行示例，实际作品应重新设计。

```json
{"mode":"free","title":"作品","width":1280,"height":720,"fps":30,"totalFrames":300,
 "font":"assets/NotoSansSC.ttf","gsap":"assets/gsap.min.js",
 "scenes":[{"id":"intro","start":0,"frames":165,"html":"scenes/intro.html","css":"scenes/intro.css","js":"scenes/intro.js"},
 {"id":"ending","start":150,"frames":150,"html":"scenes/ending.html","css":"scenes/ending.css","js":"scenes/ending.js"}],
 "assets":[],"media":[],"captions":"captions.json"}
```

时间使用整数帧，场景可重叠以完成转场，默认必须覆盖总时长；有意留黑才设 allowGaps:true。画幅须为正偶数；帧率为正整数且不超过 60。没有旧模板的标题字数、场景数量、180 秒限制，但大项目须评估内存与渲染耗时。

HTML 是 section 内部片段，CSS 使用场景 ID 限定选择器。JS 可用 tl（总时间轴）、start/duration（秒）、scene（当前 DOM）。代码自行实现构图、SVG、图形、路径、遮罩和 GSAP 动画。用 fromTo 明确状态；运动基于可跳转时间，不使用 wall clock、未设种子的随机数、实时计时器或自动播放媒体。跨镜头淡入应对后一个场景内的画面容器动画，结合重叠时间；不要仅改 transition 名称。

media 为根层媒体片段列表：id、type（image/video/audio）、src、start/frames、track；音视频可设置 in（源起点秒）、rate、volume；video 的 audio:true 保留原音，否则静音。style 用于定位/裁切，image 可写 alt。动画变换优先作用于非定时内层，避免破坏媒体提取。媒体位于根层，用全局时间操作。automation 按上游 audio 合约提供，启用前阅读相关参考并验证。

字幕为 [{start:0,end:60,text:"文本"}]，end 不包含；先用 captions.mjs 从 SRT 转换。不是语音识别或自动歌词对齐。默认字幕样式可由全局 css 覆盖。

所有外部图片、脚本、字体先保存到工程。assets 显式列出脚本动态加载的本地文件；静态 src/url 也会收集。build 记录全部声明源码/素材哈希，check/render 拒绝过期输入。此检查不是执行不受信任代码的安全沙箱；不要直接把案例、网页或未知脚本作为场景运行。

BRIEF.md 记录场景意图，不重复精确时间轴。已有工程修改只编辑相应源码、时间或素材，保留修改前版本，比较变更范围。多画幅重新设计布局和文字大小，不能只改 width/height 就声称适配完成。

纯视觉作品可设 expectText:false，允许对比度检查文本数量为零，但实际浏览器采样仍必须成功。
