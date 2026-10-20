import { motion } from 'framer-motion'
import type { RepeatKey, Task } from '../types'
import { REPEAT_LABEL, REPEAT_SORT, dayAt, nextWeekday } from '../utils/date'

interface DueMenuProps {
  task: Task
  anchor: DOMRect
  onPick: (dueAt: number | null) => void
  onRepeat: (repeat: RepeatKey | null) => void
  onClose: () => void
}

const QUICK: { label: string; value: () => number }[] = [
  { label: '今天', value: () => dayAt(0) },
  { label: '明天', value: () => dayAt(1) },
  { label: '这周末', value: () => nextWeekday(6) },
  { label: '下周一', value: () => nextWeekday(1) },
]

export default function DueMenu({ task, anchor, onPick, onRepeat, onClose }: DueMenuProps) {
  const width = 248
  const left = Math.max(12, Math.min(anchor.right - width, window.innerWidth - width - 12))
  const top = Math.max(12, Math.min(anchor.bottom + 8, window.innerHeight - 330))

  return (
    <>
      <div className="menu-scrim" onClick={onClose} />
      <motion.div
        className="due-menu"
        style={{ left, top, width }}
        initial={{ opacity: 0, y: -6, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 480, damping: 34 }}
      >
        <div className="due-grid">
          {QUICK.map((item) => (
            <button
              key={item.label}
              type="button"
              className="due-item"
              onClick={() => onPick(item.value())}
            >
              {item.label}
            </button>
          ))}
        </div>

        <label className="due-custom">
          <span>指定日期</span>
          <input
            type="date"
            onChange={(e) => {
              const value = e.target.value
              if (!value) return
              const d = new Date(`${value}T00:00:00`)
              if (!Number.isNaN(d.getTime())) onPick(d.getTime())
            }}
          />
        </label>

        <div className="due-sec">
          <span className="due-sec-label">重复</span>
          <div className="due-chips">
            <button
              type="button"
              className={`due-chip${!task.repeat ? ' is-on' : ''}`}
              onClick={() => onRepeat(null)}
            >
              不重复
            </button>
            {REPEAT_SORT.map((key) => (
              <button
                key={key}
                type="button"
                className={`due-chip${task.repeat === key ? ' is-on' : ''}`}
                onClick={() => onRepeat(key)}
              >
                {REPEAT_LABEL[key]}
              </button>
            ))}
          </div>
        </div>

        {typeof task.dueAt === 'number' && (
          <button type="button" className="due-clear" onClick={() => onPick(null)}>
            清除日期
          </button>
        )}
      </motion.div>
    </>
  )
}
