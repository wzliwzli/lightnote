import type { Task } from '../types'
import { dayAt, nextWeekday } from '../utils/date'

const HOUR = 3_600_000
const seededAt = Date.now()

/**
 * 首次使用的示例数据。
 * - 两条多标签任务用来演示交集筛选（#工作 + #周报）
 * - 两条已完成的任务时间不同：3 小时前（今天做的，会留在「今日」和「全部」底部）、
 *   26 小时前（昨天做的，只在「已完成」里）
 */
export const SAMPLE_TASKS: Task[] = [
  {
    id: 't1',
    title: '把 Q3 预算表发给财务',
    tags: ['#工作', '#财务'],
    dueAt: dayAt(0, 18, 0),
    priority: 2,
    pinned: true,
    done: false,
    createdAt: seededAt - 6 * HOUR,
  },
  {
    id: 't2',
    title: '整理周报初稿',
    note: '周五前把数据部分补完，图表用上周的模板',
    tags: ['#工作', '#周报'],
    dueAt: dayAt(0),
    priority: 1,
    pinned: false,
    done: false,
    createdAt: seededAt - 5 * HOUR,
  },
  {
    id: 't3',
    title: '给绿植浇水',
    tags: ['#生活'],
    dueAt: dayAt(0),
    repeat: 'weekly',
    priority: 0,
    pinned: false,
    done: false,
    createdAt: seededAt - 4 * HOUR,
  },
  {
    id: 't4',
    title: '买咖啡豆（浅烘，别买成拼配）',
    tags: ['#生活'],
    dueAt: dayAt(-2),
    priority: 1,
    pinned: false,
    done: false,
    createdAt: seededAt - 30 * HOUR,
  },
  {
    id: 't5',
    title: '预约周五理发',
    tags: ['#生活'],
    dueAt: nextWeekday(5),
    priority: 0,
    pinned: false,
    done: false,
    createdAt: seededAt - 2 * HOUR,
  },
  {
    id: 't6',
    title: '回复设计评审意见',
    tags: ['#工作'],
    priority: 0,
    pinned: false,
    done: true,
    completedAt: seededAt - 3 * HOUR,
    createdAt: seededAt - 28 * HOUR,
  },
  {
    id: 't7',
    title: '看完《设计中的设计》第三章',
    tags: ['#阅读'],
    priority: 0,
    pinned: false,
    done: false,
    createdAt: seededAt - 20 * HOUR,
  },
  {
    id: 't8',
    title: '整理本周阅读笔记',
    tags: ['#阅读', '#周报'],
    priority: 0,
    pinned: false,
    done: true,
    completedAt: seededAt - 26 * HOUR,
    createdAt: seededAt - 50 * HOUR,
  },
]
