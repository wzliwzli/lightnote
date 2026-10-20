import { useEffect } from 'react'
import { motion } from 'framer-motion'
import type { Task } from '../types'
import { BrandMark, IconExpand, IconMinimize, IconPin } from './Icons'
import FocusPill from './FocusPill'
import { postToShell } from '../shell'
import { formatDue } from '../utils/date'

interface MiniViewProps {
  tasks: Task[]
  now: number
  onToggle: (id: string) => void
  onSubmit: (raw: string) => void
  onExit: () => void
  focus: { title: string; remainingMs: number; totalMs: number } | null
  onStopFocus: () => void
  /** 桌面壳的悬浮窗模式：无边框窗口，需要自己拖拽 */
  floating?: boolean
}

export default function MiniView({
  tasks,
  now,
  onToggle,
  onSubmit,
  onExit,
  focus,
  onStopFocus,
  floating = false,
}: MiniViewProps) {
  // 悬浮窗可以拉大，就把待办全列出来（列表内部滚动）；浏览器里的小卡片限 6 条
  const top = floating ? tasks : tasks.slice(0, 6)

  // WebView2 是覆盖整个客户区的子窗口，窗体的 WM_NCHITTEST 收不到，
  // 所以由页面判断「指针是否贴着窗口边缘」，再让宿主进入系统缩放。
  useEffect(() => {
    if (!floating) return

    const EDGE = 9

    const edgesAt = (clientX: number, clientY: number) => {
      const w = window.innerWidth
      const h = window.innerHeight
      const left = clientX <= EDGE
      const right = clientX >= w - EDGE
      const top = clientY <= EDGE
      const bottom = clientY >= h - EDGE
      if (!left && !right && !top && !bottom) return null
      if (top && left) return 'topleft'
      if (top && right) return 'topright'
      if (bottom && left) return 'bottomleft'
      if (bottom && right) return 'bottomright'
      if (left) return 'left'
      if (right) return 'right'
      if (top) return 'top'
      return 'bottom'
    }

    const cursorFor = (dir: string | null) => {
      if (!dir) return ''
      if (dir === 'left' || dir === 'right') return 'ew-resize'
      if (dir === 'top' || dir === 'bottom') return 'ns-resize'
      if (dir === 'topleft' || dir === 'bottomright') return 'nwse-resize'
      return 'nesw-resize'
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      const dir = edgesAt(e.clientX, e.clientY)
      if (!dir) return
      e.preventDefault()
      e.stopPropagation()
      postToShell(`resize:${dir}`)
    }

    const onPointerMove = (e: PointerEvent) => {
      document.body.style.cursor = cursorFor(edgesAt(e.clientX, e.clientY))
    }

    const onLeave = () => {
      document.body.style.cursor = ''
    }

    window.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('pointermove', onPointerMove, true)
    window.addEventListener('pointerleave', onLeave, true)

    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('pointermove', onPointerMove, true)
      window.removeEventListener('pointerleave', onLeave, true)
      document.body.style.cursor = ''
    }
  }, [floating])

  return (
    <div className={`mini-wrap${floating ? ' is-float' : ''}`}>
      <motion.div
        className="mini-card"
        initial={{ opacity: 0, y: 14, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      >
        {focus && (
          <div className="mini-focus">
            <FocusPill
              title={focus.title}
              remainingMs={focus.remainingMs}
              totalMs={focus.totalMs}
              onStop={onStopFocus}
            />
          </div>
        )}

        <header
          className="mini-head"
          onPointerDown={(e) => {
            if (!floating) return
            const target = e.target as HTMLElement
            if (target.closest('button')) return
            postToShell('drag')
          }}
        >
          <BrandMark size={24} />
          <span className="mini-title">轻笺</span>
          <span className="mini-count">{tasks.length} 项待办</span>
          <button
            type="button"
            className="mini-exit"
            onClick={onExit}
            aria-label={floating ? '展开完整窗口' : '退出迷你模式'}
            title={floating ? '展开完整窗口' : '退出迷你模式'}
          >
            {floating ? <IconExpand size={15} /> : <IconMinimize size={15} />}
          </button>
        </header>

        <form
          className="mini-input"
          onSubmit={(e) => {
            e.preventDefault()
            const input = e.currentTarget.elements.namedItem('mini-task') as HTMLInputElement | null
            if (!input) return
            if (input.value.trim()) {
              onSubmit(input.value)
              input.value = ''
            }
          }}
        >
          <input name="mini-task" placeholder="写一条，Enter 保存…" aria-label="快速添加任务" />
        </form>

        <ul className="mini-list">
          {top.map((task) => {
            const due = task.dueAt ? formatDue(task.dueAt, now) : null
            return (
              <li key={task.id} className="mini-row">
                <button
                  type="button"
                  className="check"
                  data-done={task.done}
                  onClick={() => onToggle(task.id)}
                  aria-label={task.done ? '标记为未完成' : '标记为已完成'}
                >
                  <svg viewBox="0 0 24 24" aria-hidden>
                    <path
                      d="M5.6 12.7l4 4L18.6 7.4"
                      fill="none"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        strokeDasharray: 20,
                        strokeDashoffset: task.done ? 0 : 20,
                        transition: 'stroke-dashoffset .2s ease',
                      }}
                    />
                  </svg>
                </button>
                <span className={`mini-text${task.done ? ' is-done' : ''}`}>{task.title}</span>
                {task.pinned && <IconPin size={12} />}
                {due && (
                  <span className="mini-due" data-tone={due.tone}>
                    {due.label}
                  </span>
                )}
              </li>
            )
          })}
          {top.length === 0 && <li className="mini-empty">没有待办了，休息一下</li>}
        </ul>

        <footer className="mini-foot">
          {floating ? (
            <>点标题栏拖动 · 托盘图标切换窗口</>
          ) : (
            <>
              按 <kbd>Ctrl</kbd> + <kbd>M</kbd> 退出迷你模式
            </>
          )}
        </footer>
      </motion.div>
    </div>
  )
}
