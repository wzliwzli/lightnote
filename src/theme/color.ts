/** 颜色小工具：只做主题派生用到的那几件事，不引第三方色库。 */

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export function normalizeHex(input: string): string {
  let h = (input || '').trim().replace(/^#/, '')
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return '#4FC1A6'
  return `#${h.toUpperCase()}`
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = normalizeHex(hex).slice(1)
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

function srgbToLinear(channel: number): number {
  const s = channel / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

/** WCAG 相对亮度，用来决定按钮上的文字该黑还是白 */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** 在主色上压字用的深色，比纯黑柔和 */
const INK = '#0D1714'
const INK_LUMINANCE = relativeLuminance(INK)

function contrastRatio(a: number, b: number): number {
  const hi = Math.max(a, b)
  const lo = Math.min(a, b)
  return (hi + 0.05) / (lo + 0.05)
}

export function pickOnColor(hex: string): string {
  const l = relativeLuminance(hex)
  const withWhite = contrastRatio(1, l)
  const withInk = contrastRatio(l, INK_LUMINANCE)
  return withWhite >= withInk ? '#FFFFFF' : INK
}

/**
 * 朝黑或朝白混合。
 * amount 取值 -1..1：负数变暗，正数变亮。
 */
export function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex)
  const t = clamp(Math.abs(amount), 0, 1)
  const target = amount < 0 ? 0 : 255
  const mix = (c: number) => Math.round(c + (target - c) * t)
  return `#${[r, g, b]
    .map(mix)
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`
}

/** 给色块加一层极淡的同色底，用于选中态预览 */
export function alpha(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgb(${r} ${g} ${b} / ${clamp(a, 0, 1)})`
}
