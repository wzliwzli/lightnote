import { motion } from 'framer-motion'

interface SwitchProps {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
}

export default function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="switch"
      data-on={checked}
      onClick={() => onChange(!checked)}
    >
      <motion.span
        className="switch-knob"
        animate={{ x: checked ? 14 : 0 }}
        transition={{ type: 'spring', stiffness: 640, damping: 38 }}
      />
    </button>
  )
}
