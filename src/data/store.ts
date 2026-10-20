import type { Prefs, RetentionKey, Task } from '../types'
import { SAMPLE_TASKS } from './samples'

const TASKS_KEY = 'lightnote.tasks.v1'
const PREFS_KEY = 'lightnote.prefs.v1'

export const DEFAULT_PREFS: Prefs = {
  retention: '24h',
  showDoneOnTagFilter: false,
  tagMatch: 'or',
  focusMinutes: 25,
  opacity: 0.95,
}

export const RETENTION_MS: Record<RetentionKey, number> = {
  off: 0,
  '1h': 3_600_000,
  '6h': 21_600_000,
  '24h': 86_400_000,
  '3d': 259_200_000,
  forever: Number.POSITIVE_INFINITY,
}

export const RETENTION_LABEL: Record<RetentionKey, string> = {
  off: '关闭',
  '1h': '1 小时',
  '6h': '6 小时',
  '24h': '24 小时',
  '3d': '3 天',
  forever: '永久',
}

export const RETENTION_KEYS: RetentionKey[] = ['off', '1h', '6h', '24h', '3d', 'forever']

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === 'string' && v.length > 0)
}

/** 读盘时的容错：兼容旧版本的单个 tag 字段 */
function normalizeTask(value: unknown): Task | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (typeof raw.id !== 'string' || typeof raw.title !== 'string') return null

  const legacyTag = typeof raw.tag === 'string' && raw.tag ? [raw.tag] : []
  const tags = raw.tags === undefined ? legacyTag : asStringArray(raw.tags)

  const task: Task = {
    id: raw.id,
    title: raw.title,
    tags,
    priority: raw.priority === 2 ? 2 : raw.priority === 1 ? 1 : 0,
    pinned: raw.pinned === true,
    done: raw.done === true,
  }

  if (typeof raw.dueAt === 'number') task.dueAt = raw.dueAt
  if (typeof raw.completedAt === 'number') task.completedAt = raw.completedAt
  if (typeof raw.createdAt === 'number') task.createdAt = raw.createdAt
  if (typeof raw.note === 'string' && raw.note.trim()) task.note = raw.note
  if (raw.repeat === 'daily' || raw.repeat === 'weekly' || raw.repeat === 'monthly') {
    task.repeat = raw.repeat
  }

  return task
}

export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY)
    if (raw === null) return SAMPLE_TASKS
    const parsed: unknown = JSON.parse(raw)
    return normalizeTaskList(parsed)
  } catch {
    return SAMPLE_TASKS
  }
}

/** 外部数据（导入的备份）也走同一套清洗 */
export function normalizeTaskList(value: unknown): Task[] {
  if (!Array.isArray(value)) return []
  return value.map(normalizeTask).filter((t): t is Task => t !== null)
}

export function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
  } catch {
    /* 隐私模式下写不进去，不影响本次使用 */
  }
}

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return DEFAULT_PREFS
    return normalizePrefs(JSON.parse(raw))
  } catch {
    return DEFAULT_PREFS
  }
}

/** 设置也要能接受外部数据（导入的备份），统一在这里兜底 */
export function normalizePrefs(value: unknown): Prefs {
  const saved = (value ?? {}) as Partial<Prefs>
  return {
    retention:
      typeof saved.retention === 'string' && saved.retention in RETENTION_MS
        ? saved.retention
        : DEFAULT_PREFS.retention,
    showDoneOnTagFilter:
      typeof saved.showDoneOnTagFilter === 'boolean'
        ? saved.showDoneOnTagFilter
        : DEFAULT_PREFS.showDoneOnTagFilter,
    tagMatch:
      saved.tagMatch === 'and' || saved.tagMatch === 'or'
        ? saved.tagMatch
        : DEFAULT_PREFS.tagMatch,
    focusMinutes:
      typeof saved.focusMinutes === 'number' && saved.focusMinutes > 0
        ? saved.focusMinutes
        : DEFAULT_PREFS.focusMinutes,
    opacity:
      typeof saved.opacity === 'number' && saved.opacity >= 0.3 && saved.opacity <= 1
        ? saved.opacity
        : DEFAULT_PREFS.opacity,
  }
}

export function savePrefs(prefs: Prefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    /* noop */
  }
}

/** 这条已完成的任务是否还在「全部」的保留窗口内 */
export function isWithinRetention(task: Task, retention: RetentionKey, now: number): boolean {
  if (retention === 'off') return false
  if (retention === 'forever') return true
  if (typeof task.completedAt !== 'number') return false
  return now - task.completedAt <= RETENTION_MS[retention]
}
