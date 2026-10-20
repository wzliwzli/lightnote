# Lightnote 轻笺

A small to-do app I built for myself.

The old flow was too long: think of something → open the browser → find the tab → sign in → create a task. By the time that's done, I've usually forgotten what I was going to write. So I wanted something faster — a small window pinned on screen, glanceable, one click to jot a line down.

It picked up a few features along the way (tags, repeating tasks, a pomodoro timer), but the core didn't change: open it, write, close it.

[![GitHub release](https://img.shields.io/github/v/release/wzliwzli/lightnote?label=%E4%B8%8B%E8%BD%BD&color=4FC1A6)](https://github.com/wzliwzli/lightnote/releases/latest)
[![License](https://img.shields.io/badge/license-MIT-4FC1A6)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-4FC1A6)](#blocked-by-windows)

## Download

Grab `Lightnote-win64-v1.3.zip` (about 390 KB) from [Releases](https://github.com/wzliwzli/lightnote/releases/latest), unzip it anywhere, and double-click `Lightnote.exe`.

No .NET, no Node, no browser install — the WebView2 runtime that ships with Windows 10/11 is all it needs.

The package is six files in total. Keep `Lightnote.exe` next to the `web` folder and the DLLs; don't copy the exe out on its own.

## What it feels like to use

It opens as a small window in the bottom-right corner. Drag the title bar to move it, drag any of the four edges to resize, and both position and size are remembered. It doesn't take a taskbar slot — it sits in the tray overflow.

Opacity is adjustable in settings (40%–100%). Dial it down and you can faintly see the desktop behind it, so it doesn't stare at you. The full window stays opaque, which feels steadier.

Clicking the arrow at the top-right of the widget expands it into the full window — sidebar, tags, search and settings all live there. Click it again, or press `Ctrl M`, to tuck it back into the small one.

Closing the window only hides it to the tray; to really quit, pick 退出轻笺 (Quit) from the tray menu. Double-clicking the tray icon brings it back.

A few smaller things: `Enter` saves, `#tag` can be typed straight into the title (several are fine), and hovering a card shows a row of icons on the right — note for a remark, calendar for due date and repeat, pin to keep it on top, hourglass to start a focus session, trash to delete (undoable within 5 seconds).

## Syntax

Type and press `Enter` to save.
Syntax: !! urgent   ! important   * pin to top   #tag (multiple allowed)
Example: !! #work #weekly Draft the report by Friday

## Shortcuts

| Action | Key |
| --- | --- |
| Save / new task | `Enter` |
| Cancel edit, close panel, clear search | `Esc` |
| Search | `Ctrl K` |
| Collapse / expand window | `Ctrl M` |
| Undo delete | `Ctrl Z` |
| Save note | `Ctrl Enter` |
| Edit title in place | Double-click the title |

## Blocked by Windows?

It happens. The exe isn't code-signed, so after downloading it SmartScreen reports "Unknown publisher". That isn't a virus verdict — it just doesn't recognise the publisher.

To let it through: right-click `Lightnote.exe` → Properties → tick **Unblock** at the bottom → OK. Or double-click it and choose **More info** → **Run anyway**.

If it's blocked outright (some company machines are strict), open `web\index.html` from the package in any browser. Same app, minus the floating window and the tray.

## Some notes on the implementation

**Why not Electron for the desktop shell**

Too big. Hauling 100-odd MB of Chromium around for a small to-do app doesn't pay, especially when Windows already ships WebView2. So the shell is WinForms + WebView2, compiled with the `csc.exe` that comes with the .NET Framework — no SDK, no Visual Studio, and the whole source is one `Lightnote.cs`.

The trade-off is that you end up handling a pile of window details yourself. See below.

**Dragging and resizing**

WebView2 is a child window that covers the whole client area, so mouse events never reach the form — which makes the form's `WM_NCHITTEST` useless. That's how I wrote it at first, and I even tested it by posting the message straight to the form, which cheerfully reported "the edge is resizable". In practice it didn't drag at all.

The fix: the page works out how close the pointer is to the window edge and posts a message like `resize:left` to the host, which then calls `SendMessage(WM_NCLBUTTONDOWN, HTLEFT)` and hands the resize back to the system. That's why it tracks the cursor exactly like a native window. Dragging the title bar goes through the same path.

**Opacity**

Setting `Opacity` on a layered window before the handle exists does nothing; it has to wait until the window is shown. And it should only apply to the floating window — switching to the full window forces it back to 1.0, otherwise reading a long list gets tiring.

**Vite crashing on Windows for no apparent reason**

When an editor does an atomic save it first creates a `.xxx.tmpdir` directory, and Vite's watcher throws `EBUSY` trying to watch it, which kills the dev server outright. Adding dot-directories to `server.watch.ignored` sorted it out.

**Themes**

Only the brand colour is exposed. Backgrounds, text and dividers stay on one neutral grey ramp, and every derived colour — soft fills, hover states, text on the accent — is computed on the fly with `color-mix()`, with black or white chosen by contrast ratio. So even a fluorescent green accent won't turn the UI into a disaster.

**Repeating tasks**

Completing a repeating task marks that copy done and keeps it as a record, and creates a fresh one with the date moved forward. If it's badly overdue the date keeps advancing until it lands in the future, so you don't tick one box and immediately get another expired task.

## Known limitations

- Windows only. The web version runs, but without the floating window or the tray.
- No code signing, so SmartScreen will warn. Only buying a certificate fixes that.
- No cloud sync and no collaboration — deliberately left out.
- Notes are plain text; no images, no lists.
- Repeat rules are daily / weekly / monthly only; no "every N days".

## Building it yourself

You need Node 18+ and the `csc.exe` that ships with the .NET Framework (every Windows has it, nothing extra to install).

```bat
scripts\dev.cmd           :: dev preview at http://127.0.0.1:5179
scripts\build.cmd         :: bundle into a single file, dist\index.html
scripts\build-desktop.cmd :: build the desktop app, desktop\build\Lightnote.exe
```

If `node` isn't on your PATH, point the `LIGHTNOTE_NODE` environment variable at `node.exe`.

Once the shell is built you can run `Lightnote.exe --selftest`: it starts silently, waits for the page to finish loading, writes one line to a log and exits. I use it to make sure nothing was left out of the package.

## Layout

```
src/                    frontend
  App.tsx               wiring, filtering, all the actions
  shell.ts              talks to the desktop shell (drag / mode / window buttons)
  components/           task cards, lists, panels, menus, mini mode…
  theme/                theme engine
  data/                 storage and migration, import/export, sample data
  utils/                dates and repeats, chime
  styles/               tokens / base / app
desktop/src/            desktop shell (Lightnote.cs + app.ico)
scripts/                build scripts, screenshot script, icon generation
docs/                   screenshots
```

## Changelog

- **v1.3** Opacity now applies to the floating window only; fixed edge-drag resizing; started shipping a packaged zip
- **v1.2** Added opacity and grouped the settings, plus a one-click reset to defaults
- **v1.1** Added notes and repeating tasks; switched from a normal window to a floating widget plus tray

## License

MIT. Use it however you like.
