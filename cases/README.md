# 案例库

本机案例通过 scripts/cases.mjs 导入并检索。475 条源记录，196 条 partial；按规范化原文统计 418 条不同提示词、57 条重复记录。数字对应 2026-10-03 下载快照，重新导入其他快照可能改变编号和数量。

来源：https://github.com/yihui-dev/awesome-opus5-5-videos 。源仓库提供 MIT 声明，保留在 LICENSE.source；本项目不将作者原文视为自身原创。图片、视频与其他第三方素材授权单独判断。

公开发布包不含 local 原文与索引。自行从来源取得 data/videos.json 后运行：

```
node scripts/cases.mjs import <videos.json>
node scripts/cases.mjs search "纸张 转场"
node scripts/cases.mjs show <slug>
```

本机已导入原文，默认排除 partial 和重复记录，不删除它们。show 保留原文完整性标记。搜索仅返回摘录，需要时再 show。整个库不会自动进入模型上下文。
