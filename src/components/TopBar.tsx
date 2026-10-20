import { useEffect, useRef } from 'react'
import { BrandMark, IconMoon, IconSearch, IconSun, IconX } from './Icons'
import FocusPill from './FocusPill'
import { postToShell, type ShellMode } from '../shell'

interface TopBarProps {
  query: string
  onQuery: (value: string) => void
  resolvedMode: 'light' | 'dark'
  onToggleMode: () => void
  onToggleMini: () => void
  focus: { title: string; remainingMs: number; totalMs: number } | null
  onStopFocus: () => void
  shell: ShellMode
}

export default function TopBar({
  query,
  onQuery,
  resolvedMode,
  onToggleMode,
  onToggleMini,
  focus,
  onStopFocus,
  shell,
}: TopBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header
      className="topbar"
      onPointerDown={(e) => {
        if (shell === 'none') return
        const target = e.target as HTMLElement
        if (target.closest('input, button, label, a')) return
        postToShell('drag')
      }}
    >
      <div className="brand">
        <BrandMark size={30} />
        <div className="brand-text">
          <span className="brand-name">轻笺</span>
          <span className="brand-sub">Lightnote</span>
        </div>
      </div>

      <label className="search">
        <IconSearch size={16} {...{ className: 'search-icon' }} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="搜索任务…"
          spellCheck={false}
          aria-label="搜索任务"
        />
        <kbd className="search-kbd">Ctrl K</kbd>
      </label>

      {focus && (
        <FocusPill
          title={focus.title}
          remainingMs={focus.remainingMs}
          totalMs={focus.totalMs}
          onStop={onStopFocus}
        />
      )}

      <button
        type="button"
        className="mode-btn"
        onClick={onToggleMini}
        title="迷你模式（Ctrl M）"
        aria-label="进入迷你模式"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M9 4.6v4.4H4.6M15 19.4V15h4.4" />
          <path d="M4.8 9l4.2 0 0-4.4M19.2 15H15l0 4.4" />
        </svg>
      </button>

      <button
        type="button"
        className="mode-btn"
        onClick={onToggleMode}
        title={resolvedMode === 'dark' ? '切换到浅色' : '切换到深色'}
        aria-label={resolvedMode === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
      >
        {resolvedMode === 'dark' ? <IconMoon size={17} /> : <IconSun size={17} />}
      </button>

      {shell === 'full' && (
        <div className="win-controls">
          <button
            type="button"
            className="win-btn"
            onClick={() => postToShell('minimize')}
            aria-label="最小化"
            title="最小化"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <path d="M5.5 12h13" />
            </svg>
          </button>
          <button
            type="button"
            className="win-btn"
            onClick={() => postToShell('maximize')}
            aria-label="最大化"
            title="最大化 / 还原"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <rect x="5" y="5" width="14" height="14" rx="2.4" />
            </svg>
          </button>
          <button
            type="button"
            className="win-btn win-close"
            onClick={() => postToShell('close')}
            aria-label="隐藏到托盘"
            title="隐藏到托盘"
          >
            <IconX size={14} />
          </button>
        </div>
      )}
    </header>
  )
}
