import { HUNT_SOL_ERDA_ICON_SRC } from '../../lib/assetImages'

const SIZE_CLASS = {
  xs: 'w-5 h-5',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
} as const

interface SolErdaIconProps {
  size?: keyof typeof SIZE_CLASS
  className?: string
}

export default function SolErdaIcon({ size = 'sm', className = '' }: SolErdaIconProps) {
  return (
    <img
      src={HUNT_SOL_ERDA_ICON_SRC}
      alt=""
      draggable={false}
      className={`${SIZE_CLASS[size]} object-contain shrink-0 image-pixelated ${className}`}
    />
  )
}

interface HeldSolErdaStatProps {
  label: string
  count: number
}

export function HeldSolErdaStat({ label, count }: HeldSolErdaStatProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-violet-500/10 border border-violet-500/30">
      <SolErdaIcon size="md" />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xl font-bold text-violet-400 mt-0.5">{count.toLocaleString()}개</p>
      </div>
    </div>
  )
}

export function SolErdaSectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex items-start gap-3">
      <SolErdaIcon size="sm" className="mt-0.5" />
      <div>
        <h2 className="font-semibold text-slate-100">{title}</h2>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
    </div>
  )
}
