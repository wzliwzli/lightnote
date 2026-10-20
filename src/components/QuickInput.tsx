import { useRef, useState } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { IconPlus } from './Icons'

interface QuickInputProps {
  onSubmit: (value: string) => void
}

export default function QuickInput({ onSubmit }: QuickInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const shake = useAnimationControls()

  const submit = () => {
    if (!value.trim()) {
      shake.start({
        x: [0, -6, 6, -4, 3, 0],
        transition: { duration: 0.32, ease: 'easeOut' },
      })
      inputRef.current?.focus()
      return
    }
    onSubmit(value)
    setValue('')
  }

  return (
    <motion.form
      className="quick"
      animate={shake}
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <span className="quick-plus" aria-hidden>
        <IconPlus size={18} />
      </span>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setValue('')
            inputRef.current?.blur()
          }
        }}
        placeholder="写点什么，Enter 保存…"
        aria-label="快速添加任务"
        spellCheck={false}
      />
      <span className="quick-hint" aria-hidden>
        <kbd>Enter</kbd>
      </span>
    </motion.form>
  )
}
