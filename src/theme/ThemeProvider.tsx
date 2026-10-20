import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getPreset, type PresetId } from './presets'
import { normalizeHex, pickOnColor, shade } from './color'

export type ColorMode = 'light' | 'dark' | 'system'
export type ThemePreset = PresetId | 'custom'

export interface ThemeState {
  mode: ColorMode
  preset: ThemePreset
  brand: string
  radius: number
  fontSize: number
}

export const STORAGE_KEY = 'lightnote.theme.v1'

export const DEFAULTS: ThemeState = {
  mode: 'light',
  preset: 'mint',
  brand: '#4FC1A6',
  radius: 14,
  fontSize: 14,
}

interface ThemeContextValue {
  theme: ThemeState
  resolvedMode: 'light' | 'dark'
  setMode: (mode: ColorMode) => void
  toggleMode: () => void
  setPreset: (preset: PresetId) => void
  setBrand: (hex: string) => void
  setRadius: (radius: number) => void
  setFontSize: (fontSize: number) => void
  reset: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function loadTheme(): ThemeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const saved = JSON.parse(raw) as Partial<ThemeState>
    return {
      mode:
        saved.mode === 'dark' || saved.mode === 'system' || saved.mode === 'light'
          ? saved.mode
          : DEFAULTS.mode,
      preset: typeof saved.preset === 'string' ? saved.preset : DEFAULTS.preset,
      brand: typeof saved.brand === 'string' ? normalizeHex(saved.brand) : DEFAULTS.brand,
      radius: typeof saved.radius === 'number' ? saved.radius : DEFAULTS.radius,
      fontSize: typeof saved.fontSize === 'number' ? saved.fontSize : DEFAULTS.fontSize,
    }
  } catch {
    return DEFAULTS
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeState>(loadTheme)
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const resolvedMode: 'light' | 'dark' =
    theme.mode === 'system' ? (systemDark ? 'dark' : 'light') : theme.mode

  // 把主题写进 CSS 变量：只放开主色，背景 / 文字 / 线条保持中性层
  useEffect(() => {
    const root = document.documentElement
    const preset = theme.preset === 'custom' ? null : getPreset(theme.preset)
    const brand = normalizeHex(theme.brand)
    const strong = preset ? preset.brandStrong : shade(brand, -0.18)

    root.classList.add('is-theming')
    root.dataset.mode = resolvedMode
    root.dataset.preset = theme.preset
    root.style.setProperty('--brand', brand)
    root.style.setProperty('--brand-base', brand)
    root.style.setProperty('--brand-strong', strong)
    root.style.setProperty('--on-brand', pickOnColor(brand))
    root.style.setProperty('--important-base', preset ? preset.important : '#D79B2B')
    root.style.setProperty('--urgent-base', preset ? preset.urgent : '#E0654E')
    root.style.setProperty('--radius-card', `${theme.radius}px`)
    root.style.setProperty('--radius-input', `${Math.max(8, theme.radius - 2)}px`)
    root.style.setProperty('--radius-btn', `${Math.max(6, theme.radius - 5)}px`)
    root.style.setProperty('--fs-base', `${theme.fontSize}px`)

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(theme))
    } catch {
      /* 隐私模式下写不进去就算了，不影响使用 */
    }

    const timer = window.setTimeout(() => root.classList.remove('is-theming'), 400)
    return () => window.clearTimeout(timer)
  }, [theme, resolvedMode])

  const setMode = useCallback((mode: ColorMode) => {
    setTheme((t) => ({ ...t, mode }))
  }, [])

  const toggleMode = useCallback(() => {
    setTheme((t) => {
      const nextDark =
        t.mode === 'system'
          ? !window.matchMedia('(prefers-color-scheme: dark)').matches
          : t.mode !== 'dark'
      return { ...t, mode: nextDark ? 'dark' : 'light' }
    })
  }, [])

  const setPreset = useCallback((preset: PresetId) => {
    const p = getPreset(preset)
    setTheme((t) => ({ ...t, preset, brand: p.brand }))
  }, [])

  const setBrand = useCallback((hex: string) => {
    setTheme((t) => ({ ...t, preset: 'custom', brand: normalizeHex(hex) }))
  }, [])

  const setRadius = useCallback((radius: number) => {
    setTheme((t) => ({ ...t, radius }))
  }, [])

  const setFontSize = useCallback((fontSize: number) => {
    setTheme((t) => ({ ...t, fontSize }))
  }, [])

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* noop */
    }
    setTheme(DEFAULTS)
  }, [])

  const value = useMemo(
    () => ({
      theme,
      resolvedMode,
      setMode,
      toggleMode,
      setPreset,
      setBrand,
      setRadius,
      setFontSize,
      reset,
    }),
    [theme, resolvedMode, setMode, toggleMode, setPreset, setBrand, setRadius, setFontSize, reset],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme 必须在 <ThemeProvider> 内使用')
  return ctx
}
