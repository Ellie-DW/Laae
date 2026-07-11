import { HUNT_MESO_ICON_SRC } from '../../lib/assetImages'

const SIZE_CLASS = {
  xs: 'w-5 h-5',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
} as const

interface MesoIconProps {
  size?: keyof typeof SIZE_CLASS
  className?: string
}

export default function MesoIcon({ size = 'sm', className = '' }: MesoIconProps) {
  return (
    <img
      src={HUNT_MESO_ICON_SRC}
      alt=""
      draggable={false}
      className={`${SIZE_CLASS[size]} object-contain shrink-0 image-pixelated ${className}`}
    />
  )
}
