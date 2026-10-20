export type Priority = 0 | 1 | 2

export type ViewId = 'today' | 'all' | 'done' | 'pinned'

export type DueTone = 'overdue' | 'today' | 'soon' | 'normal'

/** 重复规则 */
export type RepeatKey = 'daily' | 'weekly' | 'monthly'

export interface Task {
  id: string
  title: string
  /** 备注，展开在标题下面 */
  note?: string
  /** 一条任务可以有多个标签，交集筛选才有意义 */
  tags: string[]
  /** 截止时间戳（ms），label 和颜色由 formatDue 现算 */
  dueAt?: number
  /** 完成后自动生成下一次 */
  repeat?: RepeatKey
  priority: Priority
  pinned: boolean
  done: boolean
  /** 完成时间戳（ms），用于「全部」的保留窗口和「今日」的当天归档 */
  completedAt?: number
  createdAt?: number
}

export interface ViewCounts {
  today: number
  all: number
  done: number
  pinned: number
}

/** 完成的任务在「全部」里停留多久 */
export type RetentionKey = 'off' | '1h' | '6h' | '24h' | '3d' | 'forever'

/** 多选标签时的筛选方式：并集（命中任一）/ 交集（全部命中） */
export type TagMatch = 'or' | 'and'

export interface Prefs {
  retention: RetentionKey
  /** 标签筛选时是否把已完成的任务也列出来 */
  showDoneOnTagFilter: boolean
  tagMatch: TagMatch
  /** 一次专注的分钟数 */
  focusMinutes: number
  /** 桌面悬浮窗的不透明度 0.3 ~ 1 */
  opacity: number
}
