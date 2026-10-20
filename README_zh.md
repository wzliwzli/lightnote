# 轻笺 Lightnote

给自己做的一个小待办。

原来的流程太长了：想到一件事 → 打开浏览器 → 翻到某个标签页 → 登录 → 新建任务。等这些做完，那件事大概已经忘了。所以想要一个更快的东西 —— 屏幕上钉一个小窗，抬眼能看见，点一下就能记一条。

写着写着功能多了些（标签、重复、番茄钟），但核心没变：打开就能写，写完关掉。

[![GitHub release](https://img.shields.io/github/v/release/wzliwzli/lightnote?label=%E4%B8%8B%E8%BD%BD&color=4FC1A6)](https://github.com/wzliwzli/lightnote/releases/latest)
[![License](https://img.shields.io/badge/license-MIT-4FC1A6)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-4FC1A6)](#被-windows-拦住了)

![悬浮窗](docs/17-float.png)

## 下载

在 [Releases](https://github.com/wzliwzli/lightnote/releases/latest) 里下 `Lightnote-win64-v1.3.zip`（约 390 KB），解压到任意文件夹，双击 `Lightnote.exe`。

不用装 .NET，不用装 Node，也不用装浏览器 —— Windows 10/11 自带的 WebView2 就够跑。

整个包就六个文件，exe 和 web 文件夹得放在一起，别只把 exe 单独拷出去。

## 用起来大概是这样

打开就是右下角一个小窗，拖标题栏能挪，拖四条边能改大小，位置和尺寸都记着。它不占任务栏，平时收在右下角托盘的三角里。

透明度能在设置里调（40%–100%）。调低一点，能隐约看见底下的桌面，不那么挡眼。完整窗口不跟着透明，看着踏实。

点小窗右上角的箭头会展开成完整窗口，侧栏、标签、搜索、设置都在那边。再点一下，或者按 `Ctrl M`，收回小窗。

关窗口只是藏进托盘，真要退出在托盘菜单里点「退出轻笺」。托盘图标双击能叫回来。

几件小事：`Enter` 保存，`#标签` 直接写在标题里（可以写多个），悬停卡片右边有一排小图标 —— 便签是备注，日历是日期和重复，图钉置顶，沙漏开始专注，垃圾桶删除（5 秒内能撤销）。

| | |
| --- | --- |
| ![悬停操作条](docs/03-hover.png) | ![专注 + 迷你](docs/14-mini-focus.png) |
| 悬停出操作条 | 迷你模式里的专注倒计时 |
| ![设置](docs/08-settings.png) | ![深色](docs/10-dark.png) |
| 设置 | 深色模式 |

## 语法

输入 `Enter` 保存
语法：!! 紧急   ! 重要   * 置顶   #标签（可写多个）
例：!! #工作 #周报 周五前交初稿

## 快捷键

| 操作 | 按键 |
| --- | --- |
| 保存 / 新建 | `Enter` |
| 取消编辑、关面板、清搜索 | `Esc` |
| 搜索 | `Ctrl K` |
| 收起 / 展开窗口 | `Ctrl M` |
| 撤销删除 | `Ctrl Z` |
| 保存备注 | `Ctrl Enter` |
| 就地编辑标题 | 双击标题 |

## 被 Windows 拦住了？

会有。exe 没买代码签名证书，从网上下载之后 SmartScreen 会提示「未知发布者」。这不是查毒结果，只是它不认识这个发布者。

放行：右键 `Lightnote.exe` → 属性 → 底部勾上「解除锁定」→ 确定。或者双击后点「更多信息」→「仍要运行」。

实在不放行（有些公司电脑策略很严），直接用浏览器打开包里的 `web\index.html`，功能一样，就是没有悬浮窗和托盘。

## 一些实现上的碎碎念

**为什么桌面壳不用 Electron**

太大了。为了一个小待办背 100 多 MB 的 Chromium 不划算，何况 Windows 自己就带着 WebView2。所以外壳是 WinForms + WebView2，用 .NET Framework 自带的 `csc.exe` 编译 —— 不用装 SDK，不用装 Visual Studio，源码就一个 `Lightnote.cs`。

代价是得自己处理一堆窗口细节，见下面几条。

**拖拽和缩放**

WebView2 是个铺满窗口的子窗口，鼠标事件到不了窗体那一层，所以窗体的 `WM_NCHITTEST` 写了也白写。我一开始就是这么写的，还直接给窗体发消息测试，结果显示「边缘可缩放」，实际拖不动。

后来改成：页面里判断指针离窗口边缘多近，发一条 `resize:left` 之类的消息给宿主，宿主再 `SendMessage(WM_NCLBUTTONDOWN, HTLEFT)`，把缩放交还给系统。这样跟手程度和原生窗口一样。拖标题栏也是同一个路子。

**透明度**

分层窗口的 `Opacity` 在句柄创建之前设置是无效的，得等窗口显示出来再设。另外它只该作用在悬浮窗上，切到完整窗口时强制回 1.0 —— 不然看长列表会很累。

**Vite 在 Windows 上会莫名其妙崩**

编辑器做原子写的时候会先建一个 `.xxx.tmpdir` 临时目录，Vite 的 watcher 去监听它会抛 `EBUSY`，dev server 直接退出。把点开头的目录加进 `server.watch.ignored` 就好了。

**主题**

只放开主色。背景、文字、分割线永远是同一套中性灰，派生出来的浅底、hover、按钮文字色全用 `color-mix()` 现算，主色上的字按对比度自动选黑或白。这样随便挑个荧光绿，也不会变成一场灾难。

**重复任务**

勾掉一个带重复的任务时，这一份标记完成留作记录，同时生成一份新的、日期往后推。逾期很久的话会一路推到未来的最近一次，不会一勾又冒出来一条过期的。

## 已知的不足

- 只有 Windows 版。网页版能跑，但没有悬浮窗和托盘。
- 没有代码签名，所以会有 SmartScreen 提示，这个只能靠买证书解决。
- 没有云同步，也没有协作，这部分是有意不做的。
- 备注是纯文本，不支持图片和列表。
- 重复规则只有每天 / 每周 / 每月，没有「每 N 天」这种自定义。

## 自己编译

需要 Node 18+，以及 .NET Framework 自带的 `csc.exe`（Windows 都有，不用额外装）。

```bat
scripts\dev.cmd           :: 网页版开发预览，开在 http://127.0.0.1:5179
scripts\build.cmd         :: 打包成单文件 dist\index.html
scripts\build-desktop.cmd :: 打包桌面版 desktop\build\Lightnote.exe
```

`node` 不在 PATH 里的话，设个环境变量 `LIGHTNOTE_NODE` 指向 node.exe 就行。

桌面壳编完可以跑 `Lightnote.exe --selftest` 自检：静默启动、等页面加载完成、写一行日志然后退出。打包时我靠它确认没漏文件。

## 目录

```
src/                    前端
  App.tsx               装配、筛选、各种操作
  shell.ts              和桌面壳通信（拖拽 / 切模式 / 窗口按钮）
  components/           任务卡、列表、面板、菜单、迷你模式……
  theme/                主题引擎
  data/                 读写与迁移、导入导出、示例数据
  utils/                日期与重复、提示音
  styles/               tokens / base / app
desktop/src/            桌面壳（Lightnote.cs + app.ico）
scripts/                构建脚本、截图脚本、图标生成
docs/                   截图
```

## 更新记录

- **v1.3** 透明度只管悬浮窗；修好了边缘拖拽缩放；开始提供打包好的压缩包
- **v1.2** 加了透明度和设置分组，设置能一键恢复默认
- **v1.1** 加了备注和重复任务，形态从普通窗口改成悬浮窗 + 托盘

## 许可

MIT，随便用。
