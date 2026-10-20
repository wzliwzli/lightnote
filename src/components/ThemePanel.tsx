import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from '../theme/ThemeProvider'
import { PRESETS, getPreset } from '../theme/presets'
import { IconMonitor, IconMoon, IconPlus, IconSun, IconX } from './Icons'

const MODES = [
  { id: 'light' as const, label: '浅色', Icon: IconSun },
  { id: 'dark' as const, label: '深色', Icon: IconMoon },
  { id: 'system' as const, label: '跟随', Icon: IconMonitor },
]

export default function ThemePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, setMode, setPreset, setBrand, setRadius, setFontSize, reset } = useTheme()
  const preset = theme.preset === 'custom' ? null : getPreset(theme.preset)

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
            className="popover theme-panel"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 460, damping: 34 }}
            role="dialog"
            aria-label="主题与外观"
          >
            <div className="tp-head">
              <span>主题与外观</span>
              <button type="button" className="tp-close" onClick={onClose} aria-label="关闭">
                <IconX size={15} />
              </button>
            </div>

            <div className="tp-sec">
              <div className="tp-label">外观</div>
              <div className="tp-seg">
                {MODES.map(({ id, label, Icon }) => {
                  const on = theme.mode === id
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`tp-seg-item${on ? ' is-on' : ''}`}
                      onClick={() => setMode(id)}
                      aria-pressed={on}
                    >
                      {on && (
                        <motion.span
                          layoutId="tp-seg-bg"
                          className="tp-seg-bg"
                          transition={{ type: 'spring', stiffness: 480, damping: 38 }}
                        />
                      )}
                      <Icon size={15} />
                      <span>{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="tp-sec">
              <div className="tp-label">主题色</div>
              <div className="tp-swatches">
                {PRESETS.map((p) => {
                  const on = theme.preset === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`tp-swatch${on ? ' is-on' : ''}`}
                      onClick={() => setPreset(p.id)}
                      aria-pressed={on}
                      title={p.hint}
                    >
                      <span className="tp-dot" style={{ background: p.brand }} />
                      <span className="tp-name">{p.name}</span>
                    </button>
                  )
                })}

                <label className={`tp-swatch${theme.preset === 'custom' ? ' is-on' : ''}`} title="自定义主色">
                  <span
                    className="tp-dot tp-dot-custom"
                    style={theme.preset === 'custom' ? { background: theme.brand } : undefined}
                  >
                    {theme.preset === 'custom' ? null : <IconPlus size={11} />}
                  </span>
                  <span className="tp-name">自定义</span>
                  <input
                    type="color"
                    value={theme.brand}
                    onChange={(e) => setBrand(e.target.value)}
                    aria-label="自定义主色"
                  />
                </label>
              </div>
            </div>

            <div className="tp-sec">
              <div className="tp-row">
                <span className="tp-label">圆角</span>
                <span className="tp-val">{theme.radius}px</span>
              </div>
              <input
                type="range"
                className="tp-range"
                min={8}
                max={22}
                step={1}
                value={theme.radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                aria-label="圆角大小"
              />
            </div>

            <div className="tp-sec">
              <div className="tp-row">
                <span className="tp-label">字号</span>
                <span className="tp-val">{theme.fontSize}px</span>
              </div>
              <input
                type="range"
                className="tp-range"
                min={12}
                max={17}
                step={1}
                value={theme.fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                aria-label="字号大小"
              />
            </div>

            <div className="tp-foot">
              <span className="tp-hint">{preset ? preset.hint : '自定义主色，其余自动派生'}</span>
              <button type="button" className="tp-reset" onClick={reset}>
                恢复默认
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
