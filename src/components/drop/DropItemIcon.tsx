import { getDropIconSrc } from '../../lib/assetImages'
import { normalizeDropItemName } from '../../data/dropItems'

const SIZE_CLASS = {
  xs: 'w-5 h-5',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
} as const

interface DropItemIconProps {
  name: string
  size?: keyof typeof SIZE_CLASS
  className?: string
}

export default function DropItemIcon({ name, size = 'sm', className = '' }: DropItemIconProps) {
  const src = getDropIconSrc(normalizeDropItemName(name))

  if (!src) {
    return (
      <span
        className={`${SIZE_CLASS[size]} rounded bg-dark-surface border border-dark-border flex items-center justify-center text-[10px] text-slate-600 shrink-0 ${className}`}
        aria-hidden
      >
        💎
      </span>
    )
  }

  return (
    <img
      src={src}
      alt=""
      draggable={false}
      className={`${SIZE_CLASS[size]} object-contain shrink-0 image-pixelated ${className}`}
    />
  )
}
