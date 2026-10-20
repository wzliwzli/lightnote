import type { DueTone, RepeatKey } from '../types'

const DAY = 86_400_000
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export const REPEAT_LABEL: Record<RepeatKey, string> = {
  daily: '每天',
  weekly: '每周',
  monthly: '每月',
}

export const REPEAT_SORT: RepeatKey[] = ['daily', 'weekly', 'monthly']

export function startOfDay(ts: number): number {
  const d = new Date(ts)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

/** to 相对 from 差几个自然日（负数表示已过期） */
export function dayDiff(from: number, to: number): number {
  return Math.round((startOfDay(to) - startOfDay(from)) / DAY)
}

export function isSameDay(a: number | undefined, b: number): boolean {
  return typeof a === 'number' && startOfDay(a) === startOfDay(b)
}

/** 今天 / 明天 / 周五 / 3 月 5 日 / 逾期 2 天 */
export function formatDue(
  dueAt: number,
  now: number,
): { label: string; tone: DueTone } {
  const d = new Date(dueAt)
  const diff = dayDiff(now, dueAt)
  const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0
  const time = hasTime
    ? ` ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    : ''

  if (diff < 0) return { label: `逾期 ${-diff} 天`, tone: 'overdue' }
  if (diff === 0) return { label: `今天${time}`, tone: 'today' }
  if (diff === 1) return { label: `明天${time}`, tone: 'soon' }
  if (diff <= 7) return { label: `${WEEKDAYS[d.getDay()]}${time}`, tone: 'normal' }
  return { label: `${d.getMonth() + 1} 月 ${d.getDate()} 日${time}`, tone: 'normal' }
}

/** 今天 0 点 + dayOffset 天，可选指定时分 */
export function dayAt(dayOffset: number, hour = 0, minute = 0): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hour, minute, 0, 0)
  return d.getTime()
}

/** 下一个周几（1=周一 … 6=周六），今天算下周 */
export function nextWeekday(target: number): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const delta = ((target - d.getDay() + 7) % 7) || 7
  d.setDate(d.getDate() + delta)
  return d.getTime()
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function stepOnce(ts: number, repeat: RepeatKey): number {
  const d = new Date(ts)
  if (repeat === 'daily') {
    d.setDate(d.getDate() + 1)
  } else if (repeat === 'weekly') {
    d.setDate(d.getDate() + 7)
  } else {
    const day = d.getDate()
    d.setMonth(d.getMonth() + 1)
    // 1 月 31 日 + 1 个月 → 2 月最后一天，而不是滚到 3 月
    if (d.getDate() < day) d.setDate(0)
  }
  return d.getTime()
}

/**
 * 下一次应该出现在哪天。
 * 逾期很久的重复任务会一直往后推，直到落在未来（最多推 400 次兜底）。
 */
export function nextOccurrence(
  dueAt: number | undefined,
  repeat: RepeatKey,
  now: number,
): number {
  let ts = dueAt ?? now
  let guard = 0
  do {
    ts = stepOnce(ts, repeat)
    guard += 1
  } while (ts <= now && guard < 400)
  return ts
}
