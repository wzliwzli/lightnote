import type { Prefs, Task } from '../types'
import { formatDue } from '../utils/date'

export interface Backup {
  app: 'lightnote'
  version: number
  exportedAt: number
  tasks: Task[]
  prefs: Prefs
  theme?: unknown
}

export function buildBackup(tasks: Task[], prefs: Prefs, theme: unknown): string {
  const data: Backup = {
    app: 'lightnote',
    version: 1,
    exportedAt: Date.now(),
    tasks,
    prefs,
    theme,
  }
  return JSON.stringify(data, null, 2)
}

export function buildMarkdown(tasks: Task[], now: number): string {
  const line = (t: Task) => {
    const box = t.done ? '- [x]' : '- [ ]'
    const pin = t.pinned ? ' 📌' : ''
    const tags = t.tags.length ? ` ${t.tags.join(' ')}` : ''
    const due = t.dueAt ? ` · ${formatDue(t.dueAt, now).label}` : ''
    return `${box}${pin} ${t.title}${tags}${due}`
  }

  const open = tasks.filter((t) => !t.done)
  const done = tasks.filter((t) => t.done)
  const d = new Date(now)
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`

  return [
    `# 轻笺备份 ${date}`,
    '',
    `## 未完成（${open.length}）`,
    ...open.map(line),
    '',
    `## 已完成（${done.length}）`,
    ...done.map(line),
    '',
  ].join('\n')
}

export function download(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

export function parseBackup(text: string): { tasks: unknown[]; prefs?: unknown } | null {
  try {
    const data = JSON.parse(text) as { tasks?: unknown; prefs?: unknown }
    if (!data || !Array.isArray(data.tasks)) return null
    return { tasks: data.tasks, prefs: data.prefs }
  } catch {
    return null
  }
}
