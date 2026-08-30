import { useHuntAlert } from '../../contexts/HuntAlertContext'
import { formatCountdown, formatDurationLabel, hasActiveHuntAlert } from '../../lib/huntAlert'

interface HuntAlertFloatProps {
  visible: boolean
  onOpen: () => void
  onGoHunt: () => void
}

export default function HuntAlertFloat({ visible, onOpen, onGoHunt }: HuntAlertFloatProps) {
  const alert = useHuntAlert()
  const active = alert.timers.filter((timer) => timer.status !== 'idle')

  if (!visible || !hasActiveHuntAlert(alert.timers) || active.length === 0) return null

  const hasDone = active.some((timer) => timer.status === 'done')

  return (
    <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-[60] w-[16.5rem] max-w-[calc(100vw-2rem)]">
      <div className={`panel-glow px-3 py-2.5 space-y-2 shadow-lg ${hasDone ? 'animate-pulse' : ''}`}>
        <button type="button" onClick={onOpen} className="w-full text-left space-y-1.5">
          {active.map((timer) => (
            <div key={timer.id} className="flex items-center justify-between gap-2">
              <p className="text-[10px] text-slate-500 truncate">
                {timer.status === 'done'
                  ? '알림'
                  : timer.status === 'paused'
                    ? '일시정지'
                    : formatDurationLabel(timer.durationMs)}
              </p>
              <p
                className={`font-display text-sm tracking-wider shrink-0 ${
                  timer.status === 'done' ? 'text-maple-400' : 'text-cyber-300'
                }`}
              >
                {formatCountdown(timer.remainingMs)}
              </p>
            </div>
          ))}
        </button>
        <div className="flex justify-end gap-2">
          {active.some((timer) => timer.status === 'running') ? (
            <button type="button" onClick={alert.pauseAll} className="btn-secondary text-xs px-2 py-1">
              정지
            </button>
          ) : null}
          {active.some((timer) => timer.status === 'paused') &&
          !active.some((timer) => timer.status === 'running') ? (
            <button type="button" onClick={() => void alert.startAll()} className="btn-primary text-xs px-2 py-1">
              재개
            </button>
          ) : null}
          {hasDone ? (
            <button type="button" onClick={onGoHunt} className="btn-primary text-xs px-2 py-1">
              기록
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
