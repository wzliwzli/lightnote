import { formatClock } from '../utils/date'
import { IconX } from './Icons'

interface FocusPillProps {
  title: string
  remainingMs: number
  totalMs: number
  onStop: () => void
}

const RADIUS = 9
const CIRC = 2 * Math.PI * RADIUS

export default function FocusPill({ title, remainingMs, totalMs, onStop }: FocusPillProps) {
  const pct = totalMs <= 0 ? 0 : Math.max(0, Math.min(1, remainingMs / totalMs))

  return (
    <div className="focus-pill" title={`专注中：${title}`}>
      <svg className="focus-ring" viewBox="0 0 24 24" width="22" height="22" aria-hidden>
        <circle cx="12" cy="12" r={RADIUS} className="focus-track" />
        <circle
          cx="12"
          cy="12"
          r={RADIUS}
          className="focus-bar"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - pct)}
          transform="rotate(-90 12 12)"
        />
      </svg>
      <span className="focus-time">{formatClock(remainingMs)}</span>
      <button type="button" className="focus-stop" onClick={onStop} aria-label="结束专注">
        <IconX size={13} />
      </button>
    </div>
  )
}
