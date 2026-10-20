import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { RETENTION_KEYS, RETENTION_LABEL } from '../data/store'
import type { ShellMode } from '../shell'
import type { Prefs, TagMatch } from '../types'
import { IconChevron, IconDownload, IconGithub, IconUpload, IconX } from './Icons'

const REPO_URL = 'https://github.com/wzliwzli/lightnote'

interface SettingsPanelProps {
  open: boolean
  onClose: () => void
  prefs: Prefs
  onChange: (patch: Partial<Prefs>) => void
  onReset: () => void
  taskCount: number
  onExportJson: () => void
  onExportMarkdown: () => void
  onImport: (file: File) => void
  shell: ShellMode
}

const TAG_MATCH_OPTIONS: { key: TagMatch; label: string }[] = [
  { key: 'or', label: '并集 · 命中任一' },
  { key: 'and', label: '交集 · 全部命中' },
]

const FOCUS_OPTIONS = [15, 25, 45]

export default function SettingsPanel({
  open,
  onClose,
  prefs,
  onChange,
  onReset,
  taskCount,
  onExportJson,
  onExportMarkdown,
  onImport,
  shell,
}: SettingsPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirming, setConfirming] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [view, setView] = useState<'main' | 'advanced'>('main')

  useEffect(() => {
    if (open) {
      setView('main')
      setConfirming(false)
      setConfirmReset(false)
    }
  }, [open])

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setConfirming(false)
    onImport(file)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="panel-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />

          <motion.aside
            className="popover settings-panel"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 460, damping: 34 }}
            role="dialog"
            aria-label={view === 'main' ? '设置' : '拓展设置'}
          >
            {view === 'main' ? (
              <>
                <div className="tp-head">
                  <span>设置</span>
                  <button type="button" className="tp-close" onClick={onClose} aria-label="关闭">
                    <IconX size={15} />
                  </button>
                </div>

                <div className="tp-sec">
                  <div className="tp-label">完成的任务在「全部」保留</div>
                  <div className="st-options">
                    {RETENTION_KEYS.map((key) => (
                      <button
                        key={key}
                        type="button"
                        className={`st-chip${prefs.retention === key ? ' is-on' : ''}`}
                        onClick={() => onChange({ retention: key })}
                        aria-pressed={prefs.retention === key}
                      >
                        {RETENTION_LABEL[key]}
                      </button>
                    ))}
                  </div>
                  <p className="st-note">
                    勾掉的任务先在「全部」底部停留一段时间，之后只出现在「已完成」里。
                  </p>
                </div>

                {shell !== 'none' && (
                  <div className="tp-sec">
                    <div className="tp-row">
                      <span className="tp-label">悬浮窗透明度</span>
                      <span className="tp-val">{Math.round(prefs.opacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      className="tp-range"
                      min={40}
                      max={100}
                      step={1}
                      value={Math.round(prefs.opacity * 100)}
                      onChange={(e) => onChange({ opacity: Number(e.target.value) / 100 })}
                      aria-label="悬浮窗透明度"
                    />
                    <p className="st-note">只影响悬浮窗；完整窗口保持不透明。越通透越不挡桌面，文字也会跟着变淡。</p>
                  </div>
                )}

                <div className="tp-foot">
                  <button type="button" className="st-more" onClick={() => setView('advanced')}>
                    拓展设置
                    <IconChevron size={14} />
                  </button>
                </div>

                <div className="st-bottom">
                  <a
                    className="st-repo"
                    href={REPO_URL}
                    target="_blank"
                    rel="noreferrer"
                    title="在 GitHub 上查看源码与更新"
                  >
                    <IconGithub size={13} />
                    GitHub
                  </a>

                  {confirmReset ? (
                    <span className="st-reset-actions">
                      <button
                        type="button"
                        className="st-reset-cancel"
                        onClick={() => setConfirmReset(false)}
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        className="st-reset-ok"
                        onClick={() => {
                          onReset()
                          setConfirmReset(false)
                        }}
                      >
                        确认恢复
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="st-reset"
                      onClick={() => setConfirmReset(true)}
                    >
                      恢复默认设置
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="tp-head">
                  <button type="button" className="tp-back" onClick={() => setView('main')}>
                    <IconChevron size={14} />
                    返回
                  </button>
                  <span className="tp-title">拓展设置</span>
                  <button type="button" className="tp-close" onClick={onClose} aria-label="关闭">
                    <IconX size={15} />
                  </button>
                </div>

                <div className="tp-sec">
                  <div className="tp-label">多选标签时按</div>
                  <div className="st-options">
                    {TAG_MATCH_OPTIONS.map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        className={`st-chip${prefs.tagMatch === key ? ' is-on' : ''}`}
                        onClick={() => onChange({ tagMatch: key })}
                        aria-pressed={prefs.tagMatch === key}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="st-note">
                    并集：命中任意一个标签就显示；交集：要同时命中所有选中的标签。
                  </p>
                  <p className="st-note st-note--example">
                    标题里可以写多个标签，例如{' '}
                    <b className="st-example">#工作 #周报 整理周报初稿</b>
                  </p>
                </div>

                <div className="tp-sec">
                  <div className="tp-label">一次专注</div>
                  <div className="st-options">
                    {FOCUS_OPTIONS.map((min) => (
                      <button
                        key={min}
                        type="button"
                        className={`st-chip${prefs.focusMinutes === min ? ' is-on' : ''}`}
                        onClick={() => onChange({ focusMinutes: min })}
                        aria-pressed={prefs.focusMinutes === min}
                      >
                        {min} 分钟
                      </button>
                    ))}
                  </div>
                  <p className="st-note">
                    悬停任务点小沙漏开始；结束后会响一声，不会自动勾掉任务。
                  </p>
                </div>

                <div className="tp-sec">
                  <div className="tp-label">数据</div>
                  <div className="st-actions">
                    <button type="button" className="st-btn" onClick={onExportJson}>
                      <IconDownload size={14} />
                      导出 JSON
                    </button>
                    <button type="button" className="st-btn" onClick={onExportMarkdown}>
                      <IconDownload size={14} />
                      导出 Markdown
                    </button>
                    <button
                      type="button"
                      className="st-btn"
                      onClick={() => setConfirming((v) => !v)}
                    >
                      <IconUpload size={14} />
                      导入
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {confirming && (
                      <motion.div
                        className="st-confirm"
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 10 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <span>导入会覆盖当前 {taskCount} 条任务</span>
                        <div className="st-confirm-actions">
                          <button type="button" onClick={() => setConfirming(false)}>
                            取消
                          </button>
                          <button
                            type="button"
                            className="st-confirm-ok"
                            onClick={() => fileRef.current?.click()}
                          >
                            选择文件
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/json,.json"
                    className="st-file"
                    onChange={handleFile}
                    tabIndex={-1}
                  />
                </div>

                <div className="tp-foot">
                  <span className="tp-hint">设置会记住，下次打开还是一样</span>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
