import type { Page } from '../../types'
import { NAV_ICON_SRC } from '../../lib/assetImages'

interface NavIconProps {
  page: Page
  size?: 'sm' | 'md'
  active?: boolean
}

const SIZE_CLASS = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
} as const

function AlertBellIcon({ size, active }: { size: 'sm' | 'md'; active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${SIZE_CLASS[size]} transition-all ${
        active
          ? 'text-cyber-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.55)] scale-105'
          : 'text-slate-400 opacity-85'
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6.5 9.5a5.5 5.5 0 1 1 11 0c0 6.2 2.5 6.8 2.5 8.5H4c0-1.7 2.5-2.3 2.5-8.5" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </svg>
  )
}

export default function NavIcon({ page, size = 'md', active = false }: NavIconProps) {
  if (page === 'alert') {
    return <AlertBellIcon size={size} active={active} />
  }

  return (
    <img
      src={NAV_ICON_SRC[page]}
      alt=""
      draggable={false}
      className={`${SIZE_CLASS[size]} object-contain transition-all image-pixelated ${
        active ? 'drop-shadow-[0_0_6px_rgba(34,211,238,0.55)] scale-105' : 'opacity-85'
      }`}
    />
  )
}
