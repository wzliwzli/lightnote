interface StatusBarProps {
  remaining: number
  done: number
  total: number
}

export default function StatusBar({ remaining, done, total }: StatusBarProps) {
  return (
    <footer className="statusbar">
      <div className="statusbar-inner">
        <span className="status-left">
          <i className="status-dot" aria-hidden />
          剩余 {remaining} 项 · 已完成 {done} / {total}
        </span>
        <span className="status-right">已自动保存到本机</span>
      </div>
    </footer>
  )
}
