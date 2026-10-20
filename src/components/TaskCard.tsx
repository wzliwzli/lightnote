import { useRef, useState } from 'react'
import { Reorder, motion } from 'framer-motion'
import type { Task } from '../types'
import { REPEAT_LABEL, formatDue } from '../utils/date'
import {
  IconCalendar,
  IconFlag,
  IconNote,
  IconPin,
  IconRepeat,
  IconTimer,
  IconTrash,
} from './Icons'

export interface TaskHandlers {
  onToggle: (id: string) => void
  onRename: (id: string, title: string) => void
  onDelete: (id: string) => void
  onPin: (id: string) => void
  onPriority: (id: string) => void
  onDue: (id: string, anchor: HTMLElement) => void
  onNote: (id: string, anchor: HTMLElement) => void
  onFocus: (id: string) => void
}

interface TaskCardProps {
  task: Task
  index: number
  now: number
  handlers: TaskHandlers
  focused?: boolean
}

export default function TaskCard({ task, index, now, handlers, focused }: TaskCardProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(task.title)
  const inputRef = useRef<HTMLInputElement>(null)
  const due = task.dueAt ? formatDue(task.dueAt, now) : null

  const startEdit = () => {
    setDraft(task.title)
    setEditing(true)
    window.requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }

  const commit = () => {
    const value = draft.trim()
    if (value && value !== task.title) handlers.onRename(task.id, value)
    setEditing(false)
  }

  return (
    <Reorder.Item
      as="li"
      value={task}
      className="task"
      data-prio={task.priority}
      data-pinned={task.pinned || undefined}
      data-done={task.done || undefined}
      data-focused={focused || undefined}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{
        type: 'spring',
        stiffness: 420,
        damping: 36,
        mass: 0.7,
        delay: Math.min(index * 0.02, 0.12),
      }}
    >
      <motion.button
        type="button"
        className="check"
        data-done={task.done}
        onClick={() => handlers.onToggle(task.id)}
        aria-label={task.done ? '标记为未完成' : '标记为已完成'}
        aria-pressed={task.done}
        animate={task.done ? { scale: [1, 1.18, 1] } : { scale: 1 }}
        transition={{ duration: 0.34, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          <motion.path
            d="M5.6 12.7l4 4L18.6 7.4"
            fill="none"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ pathLength: task.done ? 1 : 0, opacity: task.done ? 1 : 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          />
        </svg>
      </motion.button>

      <div className="task-main">
        {editing ? (
          <input
            ref={inputRef}
            className="task-edit"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commit()
              } else if (e.key === 'Escape') {
                e.preventDefault()
                setEditing(false)
              }
            }}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="编辑任务标题"
          />
        ) : (
          <p className="task-title" onDoubleClick={startEdit} title="双击编辑">
            <span className={`task-title-text${task.done ? ' is-done' : ''}`}>{task.title}</span>
          </p>
        )}

        {task.note && !editing && (
          <p className={`task-note${task.done ? ' is-done' : ''}`}>{task.note}</p>
        )}
      </div>

      <div className="task-meta">
        {task.pinned && (
          <span className="chip chip-pin">
            <IconPin size={11} />
            置顶
          </span>
        )}
        {task.tags.map((tag) => (
          <span key={tag} className="chip chip-tag">
            {tag}
          </span>
        ))}
        {task.repeat && (
          <span className="chip chip-repeat">
            <IconRepeat size={11} />
            {REPEAT_LABEL[task.repeat]}
          </span>
        )}
        {due && (
          <span className="chip chip-due" data-tone={due.tone}>
            {due.label}
          </span>
        )}
      </div>

      <div className="task-actions" onPointerDown={(e) => e.stopPropagation()}>
        {!task.done && (
          <>
            <button
              type="button"
              className="act"
              data-on={task.note ? true : undefined}
              onClick={(e) => handlers.onNote(task.id, e.currentTarget)}
              title={task.note ? '编辑备注' : '添加备注'}
              aria-label={task.note ? '编辑备注' : '添加备注'}
            >
              <IconNote size={15} />
            </button>
            <button
              type="button"
              className="act"
              onClick={() => handlers.onPriority(task.id)}
              title="切换重要度"
              aria-label="切换重要度"
            >
              <IconFlag size={15} />
            </button>
            <button
              type="button"
              className="act"
              data-on={task.repeat ? true : undefined}
              onClick={(e) => handlers.onDue(task.id, e.currentTarget)}
              title="日期与重复"
              aria-label="日期与重复"
            >
              <IconCalendar size={15} />
            </button>
            <button
              type="button"
              className="act"
              data-on={task.pinned || undefined}
              onClick={() => handlers.onPin(task.id)}
              title={task.pinned ? '取消置顶' : '置顶'}
              aria-label={task.pinned ? '取消置顶' : '置顶'}
            >
              <IconPin size={15} />
            </button>
            <button
              type="button"
              className="act"
              onClick={() => handlers.onFocus(task.id)}
              title="专注一会儿"
              aria-label="专注一会儿"
            >
              <IconTimer size={15} />
            </button>
          </>
        )}
        <button
          type="button"
          className="act act-danger"
          onClick={() => handlers.onDelete(task.id)}
          title="删除"
          aria-label="删除任务"
        >
          <IconTrash size={15} />
        </button>
      </div>
    </Reorder.Item>
  )
}
