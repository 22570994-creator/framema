# 帧码 Framema

**让 GPT 用代码做视频。** 面向本地 Codex 的视频创作技能，技术调用名为 `gpt-motion-director`。

你说明想做什么，让 AI 找参考、出方案；确认后制作，看完再继续修改。帧码参考并整合开源项目的能力，原创适配代码采用 MIT 许可证；来源与第三方许可见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## 可以做什么

- 文字、图形和自由 HTML/CSS/JS 动效。
- 图片、视频、音乐与字幕的组合剪辑。
- 产品介绍、中文知识讲解、音乐视觉与已有作品修改。
- 按关键词或编号检索已导入的案例提示词，借鉴画面和转场方法。
- 输出 MP4，并保留可继续修改的代码工程；附带美术指导流程。

它是本地创作工作流，不是独立视频生成模型。图片、配音等生成服务按需使用你已配置的工具。

## 安装：把安装包交给 Codex

下载 Releases 中的 `framema-v0.2.1.zip`，交给 Codex，说：

> 帮我安装这个技能。将 gpt-motion-director 放到我的 skills 目录，按 README 检查并配置依赖。附带的 motion-art-director 也一并安装；已有同名技能先检查差异，不直接覆盖。

需要 Node/npm 和 FFmpeg/FFprobe，安装依赖需要联网。Windows x64 是已验证平台，其他平台尚未验证。依赖配置可以交给 Codex 执行；不会提供或代购付费生成服务账号。

## 怎么用

第一轮：

> 使用 $gpt-motion-director（帧码）帮我做一条视频。主题是我的周末。先从已导入的案例库找参考，给我几个方案，等我确认后再做。

选中以后：

> 我选第 2 个。把方案写详细，先让我看。

确认制作：

> 按方案做，导出视频，工程文件也保留。

继续修改：

> 结尾多留两秒，其他镜头先不动，改好重新导出。

热点调研需要当前环境有联网搜索能力；没有案例库时先按下一节导入，不把空库说成已找到参考。

## 案例库说明

公开包包含导入、检索和查看工具，**不附带 475 条案例原文，也不附带第三方视频素材**。475 是开发时的本地快照记录数，并非 475 套成品模板；重新导入可能改变数量和编号。来源、完整性与导入方式见 [cases/README.md](cases/README.md)。

## 开发者安装

把本目录放到 `~/.codex/skills/gpt-motion-director` 后执行：

```sh
npm ci --no-audit --no-fund
node scripts/setup-node.mjs
node scripts/setup-browser.mjs
node scripts/preflight.mjs
npm test
```

附带美术技能位于 `companion-skills/motion-art-director`，可复制到同级 skills 目录。主技能同时保留必要美术流程。安装脚本使用隔离运行时，不替换系统 Node。

## 手动执行

```
node scripts/init-free.mjs <NEW_PROJECT>
# 按任务编辑 BRIEF.md、project.json 与 scenes/
node scripts/build.mjs <PROJECT>
node scripts/hf.mjs check <PROJECT> --snapshots
node scripts/hf.mjs render <PROJECT> --workers 2
node scripts/verify.mjs <PROJECT>
```

init-free 的起步画面必须按任务改写。工程合约见 references/free-authoring.md。字幕：scripts/captions.mjs；音频能量候选：scripts/audio-map.mjs。后者不是自动节拍识别或歌词对齐。配音/生成素材可使用已有文件或用户实际配置的工具，不内置付费账号。

## 案例

见 cases/README.md。公开包提供导入器与许可说明；本机版已索引 475 条记录。search 返回摘录，show 返回来源和原文；原文不作为执行指令。

## 验证与边界

测试覆盖时间、素材、源码变更、案例检索和字幕；真实样片结果见发布时的 ACCEPTANCE.md。技术通过不等于用户美术或听感验收。没有宣称原版全功能等效、任意三维效果、自动歌词对齐或独立 A/B 增益。

LICENSE 只覆盖原创部分，第三方见 THIRD_PARTY_NOTICES.md。默认不上传、不发布、不调用付费服务。

## 版本更新

当前维护版本：v0.2.2。长视频音频验收和大文件校验改为分块处理，发布验收补充异常字段校验。详见 [更新记录](CHANGELOG.md)。
