import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { ThemeProvider, useTheme } from './theme/ThemeProvider'
import { getPreset } from './theme/presets'
import TopBar from './components/TopBar'
import Sidebar from './components/Sidebar'
import QuickInput from './components/QuickInput'
import TaskList from './components/TaskList'
import StatusBar from './components/StatusBar'
import ThemePanel from './components/ThemePanel'
import SettingsPanel from './components/SettingsPanel'
import DueMenu from './components/DueMenu'
import NoteMenu from './components/NoteMenu'
import Toast from './components/Toast'
import MiniView from './components/MiniView'
import type { TaskHandlers } from './components/TaskCard'
import {
  DEFAULT_PREFS,
  RETENTION_LABEL,
  isWithinRetention,
  loadPrefs,
  loadTasks,
  normalizePrefs,
  normalizeTaskList,
  savePrefs,
  saveTasks,
} from './data/store'
import { buildBackup, buildMarkdown, download, parseBackup, readFileText } from './data/transfer'
import { isSameDay, nextOccurrence, REPEAT_LABEL } from './utils/date'
import { playChime } from './utils/sound'
import { initialShellMode, postToShell, subscribeShell, type ShellMode } from './shell'
import type { Prefs, Priority, RepeatKey, Task, ViewCounts, ViewId } from './types'

const VIEW_TITLE: Record<ViewId, { title: string; sub: string }> = {
  today: { title: '今日', sub: '今天到期和已经逾期的任务' },
  all: { title: '全部', sub: '所有还没完成的任务' },
  done: { title: '已完成', sub: '已经勾掉的任务' },
  pinned: { title: '置顶', sub: '钉在列表最上面的任务' },
}

const TAG_PATTERN = /(^|\s)#([^\s#]+)/g

/** 从一段文字里抽出 #标签，剩下的就是标题 */
function extractTags(text: string): { title: string; tags: string[] } {
  const tags: string[] = []
  const title = text
    .replace(TAG_PATTERN, (_match: string, _lead: string, name: string) => {
      const tag = `#${name}`
      if (!tags.includes(tag)) tags.push(tag)
      return ' '
    })
    .replace(/\s+/g, ' ')
    .trim()
  return { title, tags }
}

interface ParsedInput {
  title: string
  priority: Priority
  pinned: boolean
  tags: string[]
}

/** 轻量语法：!! 紧急 / ! 重要 / * 置顶 / #标签（可写多个） */
function parseInput(raw: string): ParsedInput {
  let text = raw.trim()
  let priority: Priority = 0
  let pinned = false

  if (text.startsWith('!!')) {
    priority = 2
    text = text.slice(2)
  } else if (text.startsWith('!')) {
    priority = 1
    text = text.slice(1)
  }

  if (text.startsWith('*')) {
    pinned = true
    text = text.slice(1)
  } else if (text.endsWith('*')) {
    pinned = true
    text = text.slice(0, -1)
  }

  const { title, tags } = extractTags(text)
  return { title, priority, pinned, tags }
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `t-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function stamp(): string {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

function shortTitle(title: string): string {
  return title.length > 14 ? `${title.slice(0, 14)}…` : title
}

/** 每分钟推一次当前时间，让保留窗口和「今日」的跨天自动生效 */
function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

interface ToastState {
  key: number
  message: string
  actionLabel?: string
  action?: () => void
}

interface FocusState {
  taskId: string
  endsAt: number
  totalMs: number
}

function Workspace() {
  const { theme, resolvedMode, toggleMode } = useTheme()
  const [tasks, setTasks] = useState<Task[]>(loadTasks)
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs)
  const [view, setView] = useState<ViewId>('today')
  const [query, setQuery] = useState('')
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [themeOpen, setThemeOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mini, setMini] = useState(initialShellMode === 'float')
  const [shellMode, setShellMode] = useState<ShellMode>(initialShellMode)
  const [dueMenu, setDueMenu] = useState<{ taskId: string; anchor: DOMRect } | null>(null)
  const [noteMenu, setNoteMenu] = useState<{ taskId: string; anchor: DOMRect } | null>(null)
  const [focus, setFocus] = useState<FocusState | null>(null)
  const [focusNow, setFocusNow] = useState(() => Date.now())
  const [toast, setToast] = useState<ToastState | null>(null)
  const toastTimer = useRef<number | null>(null)
  const lastDeleted = useRef<{ task: Task; index: number } | null>(null)
  const prefsRef = useRef(prefs)
  prefsRef.current = prefs
  const now = useNow()

  useEffect(() => {
    saveTasks(tasks)
  }, [tasks])

  useEffect(() => {
    savePrefs(prefs)
  }, [prefs])

  const showToast = (next: Omit<ToastState, 'key'>, ms = 5000) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    setToast({ ...next, key: Date.now() })
    toastTimer.current = window.setTimeout(() => setToast(null), ms)
  }

  useEffect(() => {
    if (initialShellMode === 'none') return
    const off = subscribeShell((mode) => {
      setShellMode(mode)
      setMini(mode === 'float')
      postToShell(`opacity:${prefsRef.current.opacity}`)
    })
    postToShell('ready')

    // 页面刚挂载时这条消息偶尔会赶在宿主准备好之前发出，补几次
    const timers = [150, 600, 1500].map((ms) =>
      window.setTimeout(() => postToShell(`opacity:${prefsRef.current.opacity}`), ms),
    )

    return () => {
      off()
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  // 透明度交给宿主窗口实现（页面自身是画不出桌面透光的），只作用于悬浮窗
  useEffect(() => {
    if (shellMode === 'none') return
    postToShell(`opacity:${prefs.opacity}`)
  }, [prefs.opacity, shellMode])

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current)
    }
  }, [])

  const hasTagFilter = activeTags.length > 0

  const counts = useMemo<ViewCounts>(() => {
    const open = tasks.filter((t) => !t.done)
    const todayEnd = new Date(now)
    todayEnd.setHours(23, 59, 59, 999)
    return {
      today: open.filter((t) => typeof t.dueAt === 'number' && t.dueAt <= todayEnd.getTime()).length,
      all: open.length,
      done: tasks.filter((t) => t.done).length,
      pinned: open.filter((t) => t.pinned).length,
    }
  }, [tasks, now])

  const tags = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of tasks) {
      if (t.done) continue
      for (const tag of t.tags) map.set(tag, (map.get(tag) ?? 0) + 1)
    }
    return [...map.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [tasks])

  const { open, done } = useMemo(() => {
    const q = query.trim().toLowerCase()

    const matchTags = (t: Task) => {
      if (!hasTagFilter) return true
      if (t.tags.length === 0) return false
      return prefs.tagMatch === 'and'
        ? activeTags.every((tag) => t.tags.includes(tag))
        : activeTags.some((tag) => t.tags.includes(tag))
    }
    const matchQuery = (t: Task) => !q || t.title.toLowerCase().includes(q)

    const inScope = (t: Task) => {
      if (view === 'pinned') return t.pinned
      if (view === 'today') {
        const todayEnd = new Date(now)
        todayEnd.setHours(23, 59, 59, 999)
        return typeof t.dueAt === 'number' && t.dueAt <= todayEnd.getTime()
      }
      return true
    }

    const base = tasks.filter((t) => matchTags(t) && matchQuery(t))

    const openList =
      view === 'done' ? [] : base.filter((t) => !t.done && inScope(t))

    const keepDone = (t: Task): boolean => {
      if (view === 'done') return true
      if (view === 'today') return isSameDay(t.completedAt, now)
      if (view === 'all') {
        return hasTagFilter ? true : isWithinRetention(t, prefs.retention, now)
      }
      if (view === 'pinned') return hasTagFilter ? t.pinned : false
      return false
    }

    const tagGate = view === 'done' || !hasTagFilter || prefs.showDoneOnTagFilter

    const doneList = tagGate
      ? base
          .filter((t) => t.done && keepDone(t))
          .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
      : []

    return { open: openList, done: doneList }
  }, [tasks, view, query, activeTags, hasTagFilter, prefs, now])

  const miniTasks = useMemo(() => {
    const openList = tasks.filter((t) => !t.done)
    return [...openList.filter((t) => t.pinned), ...openList.filter((t) => !t.pinned)]
  }, [tasks])

  const addTask = (raw: string) => {
    const parsed = parseInput(raw)
    if (!parsed.title) return

    const next: Task = {
      id: newId(),
      title: parsed.title,
      tags: parsed.tags,
      priority: parsed.priority,
      pinned: parsed.pinned,
      done: false,
      createdAt: Date.now(),
    }

    setTasks((prev) => [next, ...prev])

    if (hasTagFilter) {
      const matches =
        prefs.tagMatch === 'and'
          ? activeTags.every((tag) => parsed.tags.includes(tag))
          : parsed.tags.some((tag) => activeTags.includes(tag))
      if (!matches) setActiveTags([])
    }

    const showsHere = view === 'all' || (view === 'pinned' && parsed.pinned)
    if (!showsHere) setView('all')
  }

  const toggle = (id: string) => {
    const target = tasks.find((t) => t.id === id)
    if (!target) return
    const nextDone = !target.done
    const stamp = Date.now()

    setTasks((prev) => {
      const next = prev.map((t) =>
        t.id === id ? { ...t, done: nextDone, completedAt: nextDone ? stamp : undefined } : t,
      )
      // 重复任务：勾掉的这一份留作记录，同时生成下一次
      if (nextDone && target.repeat) {
        const copy: Task = {
          id: newId(),
          title: target.title,
          tags: [...target.tags],
          priority: target.priority,
          pinned: target.pinned,
          done: false,
          repeat: target.repeat,
          dueAt: nextOccurrence(target.dueAt, target.repeat, stamp),
          createdAt: stamp,
        }
        if (target.note) copy.note = target.note
        return [copy, ...next]
      }
      return next
    })

    if (nextDone && target.repeat) {
      showToast({
        message: `已完成，下一次（${REPEAT_LABEL[target.repeat]}）已经排好`,
      }, 3200)
    }
  }

  const renameTask = (id: string, text: string) => {
    const { title, tags: parsedTags } = extractTags(text)
    const nextTitle = title || text.trim()
    if (!nextTitle) return
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, title: nextTitle, tags: parsedTags.length ? parsedTags : t.tags }
          : t,
      ),
    )
  }

  const restoreTask = (task: Task, index: number) => {
    setTasks((prev) => {
      if (prev.some((t) => t.id === task.id)) return prev
      const next = [...prev]
      next.splice(Math.min(index, next.length), 0, task)
      return next
    })
    lastDeleted.current = null
    setToast(null)
  }

  const deleteTask = (id: string) => {
    const index = tasks.findIndex((t) => t.id === id)
    if (index < 0) return
    const task = tasks[index]
    lastDeleted.current = { task, index }
    setTasks((prev) => prev.filter((t) => t.id !== id))
    showToast({
      message: `已删除「${shortTitle(task.title)}」`,
      actionLabel: '撤销',
      action: () => restoreTask(task, index),
    })
  }

  const togglePin = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t)))
  }

  const cyclePriority = (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, priority: (((t.priority + 1) % 3) as Priority) } : t,
      ),
    )
  }

  const openDue = (id: string, el: HTMLElement) => {
    setDueMenu({ taskId: id, anchor: el.getBoundingClientRect() })
  }

  const pickDue = (dueAt: number | null) => {
    if (!dueMenu) return
    const id = dueMenu.taskId
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, dueAt: dueAt ?? undefined } : t)))
    setDueMenu(null)
  }

  const setTaskRepeat = (repeat: RepeatKey | null) => {
    if (!dueMenu) return
    const id = dueMenu.taskId
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, repeat: repeat ?? undefined } : t)))
  }

  const openNote = (id: string, el: HTMLElement) => {
    setDueMenu(null)
    setNoteMenu({ taskId: id, anchor: el.getBoundingClientRect() })
  }

  const saveNote = (note: string) => {
    if (!noteMenu) return
    const id = noteMenu.taskId
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, note: note || undefined } : t)))
    setNoteMenu(null)
  }

  const startFocus = (id: string) => {
    const totalMs = prefs.focusMinutes * 60_000
    setFocusNow(Date.now())
    setFocus({ taskId: id, endsAt: Date.now() + totalMs, totalMs })
  }

  const stopFocus = () => setFocus(null)

  const reorder = (moved: Task[]) => {
    const ids = moved.map((t) => t.id)
    const movedSet = new Set(ids)
    setTasks((prev) => {
      const byId = new Map(prev.map((t) => [t.id, t]))
      let k = 0
      return prev.map((t) => (movedSet.has(t.id) ? (byId.get(ids[k++]) ?? t) : t))
    })
  }

  const toggleTag = (name: string) => {
    setActiveTags((prev) => (prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]))
  }

  const openTheme = () => {
    setSettingsOpen(false)
    setThemeOpen((v) => !v)
  }

  const openSettings = () => {
    setThemeOpen(false)
    setSettingsOpen((v) => !v)
  }

  const resetPrefs = () => {
    setPrefs({ ...DEFAULT_PREFS })
    showToast({ message: '已恢复默认设置' }, 3000)
  }

  const exportJson = () => {    download(`lightnote-${stamp()}.json`, buildBackup(tasks, prefs, theme), 'application/json')
    showToast({ message: '已导出 JSON 备份' }, 3200)
  }

  const exportMarkdown = () => {
    download(`lightnote-${stamp()}.md`, buildMarkdown(tasks, now), 'text/markdown')
    showToast({ message: '已导出 Markdown' }, 3200)
  }

  const importBackup = async (file: File) => {
    try {
      const text = await readFileText(file)
      const data = parseBackup(text)
      if (!data) {
        showToast({ message: '这个文件读不出来，请选择轻笺导出的 JSON' }, 5200)
        return
      }
      const imported = normalizeTaskList(data.tasks)
      if (imported.length === 0) {
        showToast({ message: '文件里没有可导入的任务' }, 4200)
        return
      }
      setTasks(imported)
      if (data.prefs) setPrefs((p) => normalizePrefs({ ...p, ...(data.prefs as object) }))
      showToast({ message: `已导入 ${imported.length} 条任务` }, 4000)
    } catch {
      showToast({ message: '导入失败，文件可能已损坏' }, 4200)
    }
  }

  const handlers: TaskHandlers = {
    onToggle: toggle,
    onRename: renameTask,
    onDelete: deleteTask,
    onPin: togglePin,
    onPriority: cyclePriority,
    onDue: openDue,
    onNote: openNote,
    onFocus: startFocus,
  }

  // 专注计时
  useEffect(() => {
    if (!focus) return
    setFocusNow(Date.now())
    const id = window.setInterval(() => setFocusNow(Date.now()), 500)
    return () => window.clearInterval(id)
  }, [focus])

  const remainingMs = focus ? Math.max(0, focus.endsAt - focusNow) : 0

  useEffect(() => {
    if (!focus || remainingMs > 0) return
    setFocus(null)
    playChime()
    showToast({ message: `专注 ${prefs.focusMinutes} 分钟结束，起身活动一下` }, 6000)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, remainingMs])

  // 全局快捷键
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const typing =
        !!target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault()
        if (shellMode === 'float') postToShell('expand')
        else if (shellMode === 'full') postToShell('compact')
        else setMini((v) => !v)
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !typing) {
        if (lastDeleted.current) {
          e.preventDefault()
          const { task, index } = lastDeleted.current
          restoreTask(task, index)
        }
        return
      }

      if (e.key === 'Escape') {
        if (noteMenu) setNoteMenu(null)
        else if (dueMenu) setDueMenu(null)
        else if (themeOpen) setThemeOpen(false)
        else if (settingsOpen) setSettingsOpen(false)
        else if (query) setQuery('')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dueMenu, noteMenu, themeOpen, settingsOpen, query, shellMode])

  const meta = VIEW_TITLE[view]
  const pct = tasks.length === 0 ? 0 : Math.round((counts.done / tasks.length) * 100)
  const listKey = `${view}|${activeTags.join(',')}|${query.trim()}`
  const presetName = theme.preset === 'custom' ? '自定义' : getPreset(theme.preset).name

  const tagModeLabel = prefs.tagMatch === 'and' ? '交集' : '并集'
  const subLine = [
    hasTagFilter ? `${activeTags.join(' ')}（${tagModeLabel}）` : null,
    hasTagFilter ? (prefs.showDoneOnTagFilter ? '含已完成' : '只看未完成') : meta.sub,
    query.trim() ? `搜索「${query.trim()}」` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const showRecentGroup =
    view === 'all' && !hasTagFilter && prefs.retention !== 'off' && prefs.retention !== 'forever'
  const doneLabel = view === 'today' ? '今天完成' : showRecentGroup ? '刚完成' : '已完成'
  const doneNote =
    view === 'today'
      ? '明天归档'
      : showRecentGroup
        ? `保留 ${RETENTION_LABEL[prefs.retention]}`
        : null

  const focusTask = focus ? tasks.find((t) => t.id === focus.taskId) : undefined

  if (mini) {
    return (
      <MiniView
        tasks={miniTasks}
        now={now}
        onToggle={toggle}
        onSubmit={addTask}
        onExit={() => {
          if (shellMode === 'float') postToShell('expand')
          else setMini(false)
        }}
        focus={
          focus
            ? { title: focusTask?.title ?? '未命名任务', remainingMs, totalMs: focus.totalMs }
            : null
        }
        onStopFocus={stopFocus}
        floating={shellMode === 'float'}
      />
    )
  }

  return (
    <div className="app">
      <TopBar
        query={query}
        onQuery={setQuery}
        resolvedMode={resolvedMode}
        onToggleMode={toggleMode}
        onToggleMini={() => (shellMode === 'full' ? postToShell('compact') : setMini(true))}
        focus={
          focus
            ? {
                title: focusTask?.title ?? '未命名任务',
                remainingMs,
                totalMs: focus.totalMs,
              }
            : null
        }
        onStopFocus={stopFocus}
        shell={shellMode}
      />

      <div className="app-body">
        <Sidebar
          view={view}
          counts={counts}
          tags={tags}
          activeTags={activeTags}
          showDoneOnTag={prefs.showDoneOnTagFilter}
          onView={setView}
          onTag={toggleTag}
          onClearTags={() => setActiveTags([])}
          onShowDoneOnTag={(value) => setPrefs((p) => ({ ...p, showDoneOnTagFilter: value }))}
          onOpenTheme={openTheme}
          onOpenSettings={openSettings}
          presetName={presetName}
          presetColor={theme.brand}
        />

        <main className="main">
          <div className="main-fixed">
            <div className="main-inner">
              <div className="view-head">
                <div className="view-head-text">
                  <h1 className="view-title">{meta.title}</h1>
                  <p className="view-sub">{subLine}</p>
                </div>

                <div className="progress" aria-hidden>
                  <span className="progress-text">
                    <b>{counts.done}</b>
                    <i>/{tasks.length}</i>
                  </span>
                  <span className="progress-track">
                    <span className="progress-fill" style={{ width: `${pct}%` }} />
                  </span>
                </div>
              </div>

              <QuickInput onSubmit={addTask} />
            </div>
          </div>

          <motion.div className="main-scroll" layoutScroll>
            <div className="main-inner">
              <TaskList
                open={open}
                done={done}
                view={view}
                listKey={listKey}
                query={query}
                hasTagFilter={hasTagFilter}
                doneLabel={doneLabel}
                doneNote={doneNote}
                now={now}
                focusId={focus?.taskId ?? null}
                handlers={handlers}
                onReorder={reorder}
              />
            </div>
          </motion.div>

          <StatusBar remaining={counts.all} done={counts.done} total={tasks.length} />
        </main>
      </div>

      <ThemePanel open={themeOpen} onClose={() => setThemeOpen(false)} />

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        prefs={prefs}
        onChange={(patch) => setPrefs((p) => ({ ...p, ...patch }))}
        onReset={resetPrefs}
        taskCount={tasks.length}
        onExportJson={exportJson}
        onExportMarkdown={exportMarkdown}
        onImport={importBackup}
        shell={shellMode}
      />

      <AnimatePresence>
        {dueMenu &&
          (() => {
            const task = tasks.find((t) => t.id === dueMenu.taskId)
            if (!task) return null
            return (
              <DueMenu
                key="due-menu"
                task={task}
                anchor={dueMenu.anchor}
                onPick={pickDue}
                onRepeat={setTaskRepeat}
                onClose={() => setDueMenu(null)}
              />
            )
          })()}
      </AnimatePresence>

      <AnimatePresence>
        {noteMenu &&
          (() => {
            const task = tasks.find((t) => t.id === noteMenu.taskId)
            if (!task) return null
            return (
              <NoteMenu
                key="note-menu"
                task={task}
                anchor={noteMenu.anchor}
                onSave={saveNote}
                onClose={() => setNoteMenu(null)}
              />
            )
          })()}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <Toast
            key={toast.key}
            message={toast.message}
            actionLabel={toast.actionLabel}
            onAction={toast.action}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <MotionConfig reducedMotion="user">
        <Workspace />
      </MotionConfig>
    </ThemeProvider>
  )
}
