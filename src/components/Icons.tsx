import type { SVGProps } from 'react'

type IconProps = { size?: number } & Omit<SVGProps<SVGSVGElement>, 'width' | 'height'>

function base(size: number, props: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...props,
  }
}

export function IconCalendar({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
      <path d="M8 13.5h2M8 16.8h2M14 13.5h2M14 16.8h2" strokeWidth="1.5" />
    </svg>
  )
}

export function IconInbox({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M4 6.5h16M4 12h16M4 17.5h10" />
    </svg>
  )
}

export function IconCheckCircle({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.4 12.2l2.5 2.5 4.7-5" />
    </svg>
  )
}

export function IconPin({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M9.2 3.8h5.6l-.7 5.1 3.1 3.1H6.8l3.1-3.1-.7-5.1Z" />
      <path d="M12 12v8" />
    </svg>
  )
}

export function IconSearch({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <circle cx="11" cy="11" r="6.3" />
      <path d="M15.8 15.8L20 20" />
    </svg>
  )
}

export function IconPlus({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M12 5.5v13M5.5 12h13" />
    </svg>
  )
}

export function IconSun({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.8v2.2M12 19v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.8 12H5M19 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" />
    </svg>
  )
}

export function IconMoon({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z" />
    </svg>
  )
}

export function IconMonitor({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <rect x="3" y="4.5" width="18" height="12" rx="2.4" />
      <path d="M9 20h6M12 16.5V20" />
    </svg>
  )
}

export function IconPalette({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M12 20.5a8.5 8.5 0 1 1 0-17c4.7 0 8.5 3.3 8.5 7.4 0 2.3-1.7 3.6-3.7 3.6h-1.9c-1.2 0-2 .8-2 1.9 0 1.9-1.3 2.8-3 2.8Z" />
      <circle cx="8.4" cy="10.4" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7.8" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15.8" cy="9.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconChevron({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

export function IconX({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </svg>
  )
}

export function IconLeaf({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M4.8 19.2c0-7 5-12 14-12.2 0 9-5 13.4-11.2 13.4-1.4 0-2.8-.4-2.8-1.2Z" />
      <path d="M4.8 19.2C8 16 11.4 13.6 15.8 12" />
    </svg>
  )
}

export function IconClock({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 7.4v4.9l3.1 1.9" />
    </svg>
  )
}

export function IconSliders({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M4 7.5h7M17 7.5h3M4 16.5h3M13 16.5h7" />
      <circle cx="14" cy="7.5" r="2.1" />
      <circle cx="10" cy="16.5" r="2.1" />
    </svg>
  )
}

export function IconGear({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.2v2M12 18.8v2M3.2 12h2M18.8 12h2M5.8 5.8l1.4 1.4M16.8 16.8l1.4 1.4M18.2 5.8l-1.4 1.4M7.2 16.8l-1.4 1.4" />
    </svg>
  )
}

export function IconTrash({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M4.8 6.6h14.4M9.4 6.6V5.2c0-.7.6-1.2 1.2-1.2h2.8c.7 0 1.2.5 1.2 1.2v1.4" />
      <path d="M6.6 6.6l.8 11.4c.1 1 .9 1.8 1.9 1.8h5.4c1 0 1.8-.8 1.9-1.8l.8-11.4" />
      <path d="M10.4 10.4v5.6M13.6 10.4v5.6" />
    </svg>
  )
}

export function IconFlag({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M6 21V4.4" />
      <path d="M6 5.2h9.6l-1.7 3.4 1.7 3.4H6" />
    </svg>
  )
}

export function IconTimer({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <circle cx="12" cy="13.2" r="7.2" />
      <path d="M12 9.6v3.6l2.4 1.6M9.6 2.8h4.8M12 2.8v3.2" />
    </svg>
  )
}

export function IconDownload({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M12 3.6v11.2M7.8 10.8L12 15l4.2-4.2" />
      <path d="M4.6 16.4v2.2c0 .9.7 1.6 1.6 1.6h11.6c.9 0 1.6-.7 1.6-1.6v-2.2" />
    </svg>
  )
}

export function IconUpload({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M12 14.8V3.6M7.8 7.8L12 3.6l4.2 4.2" />
      <path d="M4.6 16.4v2.2c0 .9.7 1.6 1.6 1.6h11.6c.9 0 1.6-.7 1.6-1.6v-2.2" />
    </svg>
  )
}

export function IconMinimize({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M9 4.6v4.4H4.6M15 19.4V15h4.4" />
      <path d="M4.8 9l4.2 0 0-4.4M19.2 15H15l0 4.4" />
    </svg>
  )
}

export function IconUndo({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M4.4 9.2h9.2a5.4 5.4 0 0 1 0 10.8H8.4" />
      <path d="M7.8 5.2L3.8 9.2l4 4" />
    </svg>
  )
}

export function IconCheck({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M5 12.5l4.6 4.6L19 6.6" />
    </svg>
  )
}

export function IconNote({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M6 3.6h8.4L18 7.2v13.2H6z" />
      <path d="M14.2 3.6v3.7H18" />
      <path d="M9 12.2h6M9 15.6h4.2" />
    </svg>
  )
}

export function IconRepeat({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M4.8 9.2a7.2 7.2 0 0 1 12.5-2.6l1.9 2" />
      <path d="M19.4 4.8v4.2h-4.2" />
      <path d="M19.2 14.8a7.2 7.2 0 0 1-12.5 2.6l-1.9-2" />
      <path d="M4.6 19.2V15h4.2" />
    </svg>
  )
}

export function IconExpand({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M14.4 4.6h5v5M9.6 19.4h-5v-5" />
      <path d="M19.4 4.6l-6.2 6.2M4.6 19.4l6.2-6.2" />
    </svg>
  )
}

export function IconGithub({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  )
}

export function IconBrandMarkGlyph({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M10.6 16.6l3.6 3.6 7.4-7.8" />
    </svg>
  )
}

export function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <defs>
        <linearGradient id="ln-brand" x1="2" y1="1" x2="30" y2="31" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--brand)" />
          <stop offset="1" stopColor="var(--brand-strong)" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="31" height="31" rx="9.5" fill="url(#ln-brand)" />
      <path
        d="M10.6 16.6l3.6 3.6 7.4-7.8"
        stroke="var(--on-brand)"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="0.5" y="0.5" width="31" height="31" rx="9.5" stroke="rgb(255 255 255 / 0.18)" />
    </svg>
  )
}
