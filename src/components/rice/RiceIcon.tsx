import { RICE_ICON_SRC } from '../../lib/assetImages'

const SIZE_CLASS = {
  xs: 'w-3 h-3',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
} as const

interface RiceIconProps {
  size?: keyof typeof SIZE_CLASS
  className?: string
}

export default function RiceIcon({ size = 'sm', className = '' }: RiceIconProps) {
  return (
    <img
      src={RICE_ICON_SRC}
      alt=""
      draggable={false}
      className={`${SIZE_CLASS[size]} object-contain shrink-0 image-pixelated ${className}`}
    />
  )
}
