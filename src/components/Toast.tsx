import { motion } from 'framer-motion'
import { IconUndo } from './Icons'

interface ToastProps {
  message: string
  actionLabel?: string
  onAction?: () => void
}

export default function Toast({ message, actionLabel, onAction }: ToastProps) {
  return (
    <motion.div
      className="toast"
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 440, damping: 32 }}
      role="status"
    >
      <span className="toast-msg">{message}</span>
      {actionLabel && onAction && (
        <button type="button" className="toast-action" onClick={onAction}>
          <IconUndo size={14} />
          {actionLabel}
        </button>
      )}
    </motion.div>
  )
}
