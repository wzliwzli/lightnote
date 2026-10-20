import { AnimatePresence, motion } from 'framer-motion'
import type { ViewCounts, ViewId } from '../types'
import Switch from './Switch'
import {
  IconCalendar,
  IconCheckCircle,
  IconChevron,
  IconInbox,
  IconPalette,
  IconPin,
  IconSliders,
} from './Icons'

interface SidebarProps {
  view: ViewId
  counts: ViewCounts
  tags: { name: string; count: number }[]
  activeTags: string[]
  showDoneOnTag: boolean
  onView: (view: ViewId) => void
  onTag: (tag: string) => void
  onClearTags: () => void
  onShowDoneOnTag: (value: boolean) => void
  onOpenTheme: () => void
  onOpenSettings: () => void
  presetName: string
  presetColor: string
}

const NAV = [
  { id: 'today' as const, label: '今日', Icon: IconCalendar },
  { id: 'all' as const, label: '全部', Icon: IconInbox },
  { id: 'done' as const, label: '已完成', Icon: IconCheckCircle },
  { id: 'pinned' as const, label: '置顶', Icon: IconPin },
]

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return '夜深了'
  if (h < 11) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
}

export default function Sidebar({
  view,
  counts,
  tags,
  activeTags,
  showDoneOnTag,
  onView,
  onTag,
  onClearTags,
  onShowDoneOnTag,
  onOpenTheme,
  onOpenSettings,
  presetName,
  presetColor,
}: SidebarProps) {
  const hasFilter = activeTags.length > 0

  return (
    <aside className="sidebar">
      <div className="greet">
        <div className="greet-hi">
          {greeting()}
          <span className="greet-dot" aria-hidden />
        </div>
        <div className="greet-sub">
          {counts.today > 0 ? (
            <>
              今天还有 <b>{counts.today}</b> 件事
            </>
          ) : (
            '今天的事情都做完了'
          )}
        </div>
      </div>

      <nav className="nav" aria-label="视图">
        <ul>
          {NAV.map(({ id, label, Icon }) => {
            const active = view === id
            return (
              <li key={id}>
                <button
                  type="button"
                  className={`nav-item${active ? ' is-active' : ''}`}
                  onClick={() => onView(id)}
                  aria-current={active ? 'page' : undefined}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="nav-bg"
                      transition={{ type: 'spring', stiffness: 520, damping: 42 }}
                    />
                  )}
                  <span className="nav-ico">
                    <Icon size={17} />
                  </span>
                  <span className="nav-label">{label}</span>
                  <span className="nav-count">{counts[id]}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="side-sec">
        <div className="side-sec-head">
          <span>标签{hasFilter ? `（${activeTags.length}）` : ''}</span>
          {hasFilter && (
            <button type="button" className="side-clear" onClick={onClearTags}>
              清除
            </button>
          )}
        </div>

        <div className="tag-list">
          {tags.length === 0 && <span className="side-empty">还没有标签</span>}
          {tags.map((tag) => {
            const active = activeTags.includes(tag.name)
            return (
              <button
                key={tag.name}
                type="button"
                className={`tag-chip${active ? ' is-active' : ''}`}
                onClick={() => onTag(tag.name)}
                aria-pressed={active}
              >
                {tag.name}
                <span className="tag-num">{tag.count}</span>
              </button>
            )
          })}
        </div>

        <AnimatePresence initial={false}>
          {hasFilter && (
            <motion.div
              className="tag-done-row"
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 10 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="tag-done-label">显示已完成</span>
              <Switch
                checked={showDoneOnTag}
                onChange={onShowDoneOnTag}
                label="标签筛选时显示已完成的任务"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="side-foot">
        <div className="side-actions">
          <button type="button" className="theme-btn" onClick={onOpenTheme}>
            <span className="theme-dot" style={{ background: presetColor }} aria-hidden />
            <IconPalette size={16} />
            <span className="theme-name">{presetName}</span>
            <span className="theme-chev">
              <IconChevron size={14} />
            </span>
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={onOpenSettings}
            aria-label="设置"
            title="设置"
          >
            <IconSliders size={17} />
          </button>
        </div>
        <div className="side-ver">v1.3 · 桌面悬浮版</div>
      </div>
    </aside>
  )
}
