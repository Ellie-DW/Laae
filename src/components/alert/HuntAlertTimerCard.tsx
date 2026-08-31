import { useState } from 'react'
import type { HuntAlertTimer } from '../../lib/huntAlert'
import {
  HUNT_ALERT_PRESETS,
  MAX_HUNT_ALERT_TTS_LENGTH,
  canUseSpeechSynthesis,
  durationMsToParts,
  formatCountdown,
  formatDurationLabel,
  getPresetId,
  partsToDurationMs,
  resolveHuntAlertTtsText,
  speakHuntAlert,
} from '../../lib/huntAlert'

interface HuntAlertTimerCardProps {
  timer: HuntAlertTimer
  onSetDuration: (ms: number) => void
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onReset: () => void
  onRemove: () => void
  onSetRepeat: (enabled: boolean) => void
  onSetTtsMessage: (message: string) => void
  ttsEnabled: boolean
  ttsVoiceURI: string
  volume: number
  canRemove: boolean
}

export default function HuntAlertTimerCard({
  timer,
  onSetDuration,
  onStart,
  onPause,
  onResume,
  onReset,
  onRemove,
  onSetRepeat,
  onSetTtsMessage,
  ttsEnabled,
  ttsVoiceURI,
  volume,
  canRemove,
}: HuntAlertTimerCardProps) {
  const presetId = getPresetId(timer.durationMs)
  const locked = timer.status === 'running' || timer.status === 'paused'
  const [customHours, setCustomHours] = useState(() => String(durationMsToParts(timer.durationMs).hours))
  const [customMinutes, setCustomMinutes] = useState(() => String(durationMsToParts(timer.durationMs).minutes))
  const [customSeconds, setCustomSeconds] = useState(() => String(durationMsToParts(timer.durationMs).seconds))

  const applyCustomParts = (hours: string, minutes: string, seconds: string) => {
    const parsedHours = hours.trim() === '' ? 0 : Number(hours)
    const parsedMinutes = minutes.trim() === '' ? 0 : Number(minutes)
    const parsedSeconds = seconds.trim() === '' ? 0 : Number(seconds)
    if (![parsedHours, parsedMinutes, parsedSeconds].every(Number.isFinite)) return
    if (parsedHours + parsedMinutes + parsedSeconds <= 0) return
    onSetDuration(partsToDurationMs(parsedHours, parsedMinutes, parsedSeconds))
  }

  const syncCustomParts = (ms: number) => {
    const parts = durationMsToParts(ms)
    setCustomHours(String(parts.hours))
    setCustomMinutes(String(parts.minutes))
    setCustomSeconds(String(parts.seconds))
  }

  const statusLabel =
    timer.status === 'running'
      ? timer.repeatEnabled
        ? `${formatDurationLabel(timer.durationMs)}마다`
        : '진행 중'
      : timer.status === 'paused'
        ? '일시정지'
        : timer.status === 'done'
          ? '알림'
          : `${formatDurationLabel(timer.durationMs)} 대기`

  return (
    <div className="rounded-xl border border-dark-border/70 bg-dark-surface/50 p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-200">{formatDurationLabel(timer.durationMs)}</p>
          <p className={`text-xs mt-0.5 ${timer.status === 'done' ? 'text-maple-400' : 'text-slate-500'}`}>
            {statusLabel}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={timer.repeatEnabled}
              onChange={(e) => onSetRepeat(e.target.checked)}
            />
            반복
          </label>
          {canRemove ? (
            <button type="button" onClick={onRemove} className="text-xs text-slate-500 hover:text-red-400">
              삭제
            </button>
          ) : null}
        </div>
      </div>

      <p
        className={`font-display text-3xl tracking-widest text-center ${
          timer.status === 'done' ? 'text-maple-400' : 'text-cyber-300'
        }`}
      >
        {formatCountdown(timer.status === 'idle' ? timer.durationMs : timer.remainingMs)}
      </p>

      <div className="flex flex-wrap gap-2">
        {HUNT_ALERT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            disabled={locked}
            onClick={() => {
              syncCustomParts(preset.ms)
              onSetDuration(preset.ms)
            }}
            className={`px-2.5 py-1 rounded-lg text-xs border transition-colors disabled:opacity-40 ${
              presetId === preset.id
                ? 'bg-cyber-500/20 border-cyber-500/40 text-cyber-300'
                : 'border-dark-border text-slate-500 hover:text-slate-300'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="number"
          min={0}
          max={10}
          value={customHours}
          disabled={locked}
          onChange={(e) => {
            const value = e.target.value
            setCustomHours(value)
            applyCustomParts(value, customMinutes, customSeconds)
          }}
          className="input-field text-sm w-16 disabled:opacity-40"
        />
        <span className="text-xs text-slate-500">시간</span>
        <input
          type="number"
          min={0}
          max={59}
          value={customMinutes}
          disabled={locked}
          onChange={(e) => {
            const value = e.target.value
            setCustomMinutes(value)
            applyCustomParts(customHours, value, customSeconds)
          }}
          className="input-field text-sm w-16 disabled:opacity-40"
        />
        <span className="text-xs text-slate-500">분</span>
        <input
          type="number"
          min={0}
          max={59}
          value={customSeconds}
          disabled={locked}
          onChange={(e) => {
            const value = e.target.value
            setCustomSeconds(value)
            applyCustomParts(customHours, customMinutes, value)
          }}
          className="input-field text-sm w-16 disabled:opacity-40"
        />
        <span className="text-xs text-slate-500">초</span>
      </div>

      <div>
        <label className="text-xs text-slate-500 mb-1 block">읽을 말</label>
        <div className="flex gap-2">
          <input
            value={timer.ttsMessage}
            maxLength={MAX_HUNT_ALERT_TTS_LENGTH}
            onChange={(e) => onSetTtsMessage(e.target.value)}
            placeholder={`예: ${formatDurationLabel(timer.durationMs)} 됐어요`}
            className="input-field text-sm flex-1"
          />
          <button
            type="button"
            disabled={!ttsEnabled || !canUseSpeechSynthesis()}
            onClick={() => speakHuntAlert(resolveHuntAlertTtsText(timer), ttsVoiceURI, volume)}
            className="btn-secondary text-sm shrink-0 disabled:opacity-40"
          >
            들어보기
          </button>
        </div>
        <p className="text-[11px] text-slate-600 mt-1">
          비워 두면 {formatDurationLabel(timer.durationMs)} 알림으로 읽어요
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {timer.status === 'idle' || timer.status === 'done' ? (
          <button type="button" onClick={onStart} className="btn-primary text-sm">
            시작
          </button>
        ) : null}
        {timer.status === 'running' ? (
          <button type="button" onClick={onPause} className="btn-secondary text-sm">
            일시정지
          </button>
        ) : null}
        {timer.status === 'paused' ? (
          <button type="button" onClick={onResume} className="btn-primary text-sm">
            다시 시작
          </button>
        ) : null}
        <button
          type="button"
          onClick={onReset}
          disabled={timer.status === 'idle'}
          className="btn-secondary text-sm disabled:opacity-40"
        >
          초기화
        </button>
      </div>
    </div>
  )
}
