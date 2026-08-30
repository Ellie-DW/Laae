import { useHuntAlert } from '../../contexts/HuntAlertContext'
import { useSpeechVoices } from '../../hooks/useSpeechVoices'
import {
  MAX_HUNT_ALERT_TIMERS,
  canUseBrowserNotification,
  canUseSpeechSynthesis,
  formatHuntAlertVoiceLabel,
} from '../../lib/huntAlert'
import HuntAlertTimerCard from './HuntAlertTimerCard'

interface HuntAlertSectionProps {
  onGoHunt: () => void
}

export default function HuntAlertSection({ onGoHunt }: HuntAlertSectionProps) {
  const alert = useHuntAlert()
  const voices = useSpeechVoices()
  const hasDone = alert.timers.some((timer) => timer.status === 'done')
  const hasRunning = alert.timers.some((timer) => timer.status === 'running')
  const canStartAll = alert.timers.some((timer) => timer.status !== 'running')
  const atLimit = alert.timers.length >= MAX_HUNT_ALERT_TIMERS

  return (
    <section className="panel-glow p-5 space-y-5">
      <div>
        <h2 className="font-semibold text-slate-100">사냥 알리미</h2>
        <p className="text-xs text-slate-500 mt-1">
          여러 개를 동시에 돌릴 수 있어요. 예: 30분마다 + 45초마다
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void alert.startAll()}
          disabled={!canStartAll || alert.timers.length === 0}
          className="btn-primary text-sm disabled:opacity-40"
        >
          모두 시작
        </button>
        <button
          type="button"
          onClick={alert.pauseAll}
          disabled={!hasRunning}
          className="btn-secondary text-sm disabled:opacity-40"
        >
          모두 정지
        </button>
        {hasDone ? (
          <button type="button" onClick={onGoHunt} className="btn-primary text-sm">
            사냥 기록하기
          </button>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={alert.soundEnabled}
            onChange={(e) => alert.setSoundEnabled(e.target.checked)}
          />
          소리
        </label>
        <label className="block pl-6">
          <span className="text-xs text-slate-500 mb-1 flex items-center justify-between">
            소리 크기
            <span className="tabular-nums">{Math.round(alert.volume * 100)}%</span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(alert.volume * 100)}
            onChange={(e) => alert.setVolume(Number(e.target.value) / 100)}
            className="w-full accent-cyan-400"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={alert.notifyEnabled}
            disabled={!canUseBrowserNotification()}
            onChange={(e) => alert.setNotifyEnabled(e.target.checked)}
          />
          브라우저 알림
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={alert.ttsEnabled}
            disabled={!canUseSpeechSynthesis()}
            onChange={(e) => alert.setTtsEnabled(e.target.checked)}
          />
          음성으로 읽기
        </label>
        {alert.ttsEnabled && canUseSpeechSynthesis() && (
          <div className="space-y-2 pl-6">
            <label className="block">
              <span className="text-xs text-slate-500 mb-1 block">목소리</span>
              <select
                value={alert.ttsVoiceURI}
                onChange={(e) => alert.setTtsVoiceURI(e.target.value)}
                className="input-field text-sm"
              >
                <option value="">자동 · 사람처럼 들리는 한국어</option>
                {voices.map((voice) => (
                  <option key={voice.uri} value={voice.uri}>
                    {formatHuntAlertVoiceLabel(voice)}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-slate-500">
              컴퓨터에 있는 한국어 목소리 중 더 자연스러운 걸 씁니다. 들어보기로 확인해 보세요.
            </p>
          </div>
        )}
        {!canUseSpeechSynthesis() && (
          <p className="text-xs text-slate-500">이 브라우저는 음성 읽기를 지원하지 않아요.</p>
        )}
        {alert.notifyEnabled && canUseBrowserNotification() && Notification.permission === 'denied' && (
          <p className="text-xs text-maple-400">브라우저에서 알림이 차단되어 있어요. 사이트 설정에서 허용해 주세요.</p>
        )}
        {!canUseBrowserNotification() && (
          <p className="text-xs text-slate-500">이 브라우저는 알림을 지원하지 않아요. 탭을 켠 채로 소리 알림을 사용하세요.</p>
        )}
      </div>

      {alert.timers.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">아직 알리미가 없어요</p>
      ) : (
        <div className="space-y-3">
          {alert.timers.map((timer) => (
            <HuntAlertTimerCard
              key={timer.id}
              timer={timer}
              canRemove={alert.timers.length > 1}
              onSetDuration={(ms) => alert.setDuration(timer.id, ms)}
              onStart={() => void alert.start(timer.id)}
              onPause={() => alert.pause(timer.id)}
              onResume={() => alert.resume(timer.id)}
              onReset={() => alert.reset(timer.id)}
              onRemove={() => alert.removeTimer(timer.id)}
              onSetRepeat={(enabled) => alert.setRepeatEnabled(timer.id, enabled)}
              onSetTtsMessage={(message) => alert.setTtsMessage(timer.id, message)}
              ttsEnabled={alert.ttsEnabled}
              ttsVoiceURI={alert.ttsVoiceURI}
              volume={alert.volume}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={alert.addTimer}
        disabled={atLimit}
        className="btn-secondary text-sm w-full disabled:opacity-40"
      >
        {atLimit ? `알리미는 ${MAX_HUNT_ALERT_TIMERS}개까지` : '알리미 추가'}
      </button>
    </section>
  )
}
