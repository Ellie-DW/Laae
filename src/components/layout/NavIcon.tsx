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

export default function NavIcon({ page, size = 'md', active = false }: NavIconProps) {
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
