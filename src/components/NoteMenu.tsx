import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Task } from '../types'

interface NoteMenuProps {
  task: Task
  anchor: DOMRect
  onSave: (note: string) => void
  onClose: () => void
}

export default function NoteMenu({ task, anchor, onSave, onClose }: NoteMenuProps) {
  const [value, setValue] = useState(task.note ?? '')
  const width = 300
  const height = 210
  const left = Math.max(12, Math.min(anchor.right - width, window.innerWidth - width - 12))
  const top = Math.max(12, Math.min(anchor.bottom + 8, window.innerHeight - height - 12))

  const save = () => {
    onSave(value.trim())
  }

  return (
    <>
      <div className="menu-scrim" onClick={onClose} />
      <motion.div
        className="note-menu"
        style={{ left, top, width }}
        initial={{ opacity: 0, y: -6, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 480, damping: 34 }}
      >
        <div className="note-head">备注</div>
        <textarea
          className="note-input"
          value={value}
          autoFocus
          rows={4}
          placeholder="写点细节… Ctrl + Enter 保存"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault()
              save()
            } else if (e.key === 'Escape') {
              e.preventDefault()
              onClose()
            }
          }}
        />
        <div className="note-foot">
          {task.note ? (
            <button type="button" className="note-clear" onClick={() => onSave('')}>
              删除备注
            </button>
          ) : (
            <span />
          )}
          <button type="button" className="note-save" onClick={save}>
            保存
          </button>
        </div>
      </motion.div>
    </>
  )
}
