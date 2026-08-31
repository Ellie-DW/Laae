import { playHuntTtsClip, resolveHuntTtsVoice, stopHuntTtsPlayback } from './huntTts'

export const HUNT_ALERT_STORAGE_KEY = 'laae-hunt-alert'
export const HUNT_ALERT_STORE_VERSION = 2
export const DEFAULT_HUNT_ALERT_MS = 2 * 60 * 60 * 1000
export const MIN_HUNT_ALERT_MS = 1000
export const MAX_HUNT_ALERT_MS = 10 * 60 * 60 * 1000
export const MAX_HUNT_ALERT_TIMERS = 8
export const MAX_HUNT_ALERT_TTS_LENGTH = 80

export type HuntAlertStatus = 'idle' | 'running' | 'paused' | 'done'

export interface HuntAlertTimer {
  id: string
  durationMs: number
  remainingMs: number
  endsAt: number | null
  status: HuntAlertStatus
  repeatEnabled: boolean
  notified: boolean
  ttsMessage: string
}

export interface HuntAlertStore {
  version: typeof HUNT_ALERT_STORE_VERSION
  soundEnabled: boolean
  notifyEnabled: boolean
  ttsEnabled: boolean
  ttsVoiceURI: string
  volume: number
  timers: HuntAlertTimer[]
}

export interface HuntAlertVoiceOption {
  uri: string
  name: string
  lang: string
  localService: boolean
  gender: 'female' | 'male' | 'unknown'
  natural: boolean
}

export const HUNT_ALERT_PRESETS = [
  { id: 's45', label: '45초', ms: 45 * 1000 },
  { id: 'm1', label: '1분', ms: 60 * 1000 },
  { id: 'm30', label: '30분', ms: 30 * 60 * 1000 },
  { id: 'h1', label: '1시간', ms: 60 * 60 * 1000 },
  { id: 'h90', label: '1시간 30분', ms: 90 * 60 * 1000 },
  { id: 'h2', label: '2시간', ms: DEFAULT_HUNT_ALERT_MS },
] as const

export type HuntAlertPresetId = (typeof HUNT_ALERT_PRESETS)[number]['id'] | 'custom'

export function createTimerId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `timer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function createHuntAlertTimer(
  durationMs = DEFAULT_HUNT_ALERT_MS,
  options: { repeatEnabled?: boolean } = {}
): HuntAlertTimer {
  const nextDuration = clampDurationMs(durationMs)
  return {
    id: createTimerId(),
    durationMs: nextDuration,
    remainingMs: nextDuration,
    endsAt: null,
    status: 'idle',
    repeatEnabled: options.repeatEnabled ?? true,
    notified: false,
    ttsMessage: '',
  }
}

export const DEFAULT_HUNT_ALERT_STORE: HuntAlertStore = {
  version: HUNT_ALERT_STORE_VERSION,
  soundEnabled: true,
  notifyEnabled: true,
  ttsEnabled: true,
  ttsVoiceURI: 'Kore',
  volume: 0.8,
  timers: [createHuntAlertTimer(DEFAULT_HUNT_ALERT_MS, { repeatEnabled: false })],
}

export function clampVolume(value: unknown) {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return 0.8
  return Math.min(1, Math.max(0, Math.round(n * 100) / 100))
}

export function clampTtsMessageInput(value: string) {
  return value.slice(0, MAX_HUNT_ALERT_TTS_LENGTH)
}

export function sanitizeTtsMessage(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim().slice(0, MAX_HUNT_ALERT_TTS_LENGTH)
}

export function normalizeHuntAlertVoiceId(value: unknown) {
  return resolveHuntTtsVoice(typeof value === 'string' ? value : '')
}

export function clampDurationMs(ms: number) {
  if (!Number.isFinite(ms)) return DEFAULT_HUNT_ALERT_MS
  const rounded = Math.round(ms / 1000) * 1000
  return Math.min(MAX_HUNT_ALERT_MS, Math.max(MIN_HUNT_ALERT_MS, rounded))
}

export function durationMsToParts(ms: number) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000))
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

export function partsToDurationMs(hours: number, minutes: number, seconds: number) {
  const safeHours = Number.isFinite(hours) ? Math.max(0, hours) : 0
  const safeMinutes = Number.isFinite(minutes) ? Math.max(0, minutes) : 0
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0
  return clampDurationMs(((safeHours * 60 + safeMinutes) * 60 + safeSeconds) * 1000)
}

export function getPresetId(durationMs: number): HuntAlertPresetId {
  const match = HUNT_ALERT_PRESETS.find((preset) => preset.ms === durationMs)
  return match?.id ?? 'custom'
}

export function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':')
}

export function formatDurationLabel(ms: number) {
  const { hours, minutes, seconds } = durationMsToParts(ms)
  const parts: string[] = []
  if (hours > 0) parts.push(`${hours}시간`)
  if (minutes > 0) parts.push(`${minutes}분`)
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}초`)
  return parts.join(' ')
}

export function remainingFromEndsAt(endsAt: number, now = Date.now()) {
  return Math.max(0, endsAt - now)
}

export function isHuntAlertActive(status: HuntAlertStatus) {
  return status === 'running' || status === 'paused' || status === 'done'
}

export function hasActiveHuntAlert(timers: HuntAlertTimer[]) {
  return timers.some((timer) => isHuntAlertActive(timer.status))
}

export function getSoonestRunningTimer(timers: HuntAlertTimer[]) {
  return timers
    .filter((timer) => timer.status === 'running')
    .reduce<HuntAlertTimer | null>((soonest, timer) => {
      if (!soonest || timer.remainingMs < soonest.remainingMs) return timer
      return soonest
    }, null)
}

function normalizeTimer(input: Partial<HuntAlertTimer>): HuntAlertTimer {
  const durationMs = clampDurationMs(input.durationMs ?? DEFAULT_HUNT_ALERT_MS)
  let status = input.status ?? 'idle'
  let endsAt = typeof input.endsAt === 'number' ? input.endsAt : null
  let remainingMs = typeof input.remainingMs === 'number' ? input.remainingMs : durationMs
  let notified = Boolean(input.notified)

  if (status === 'running' && endsAt) {
    remainingMs = remainingFromEndsAt(endsAt)
    if (remainingMs <= 0) {
      status = 'done'
      endsAt = null
      remainingMs = 0
    }
  } else if (status === 'paused') {
    remainingMs = Math.min(durationMs, Math.max(0, remainingMs))
    endsAt = null
  } else if (status === 'done') {
    remainingMs = 0
    endsAt = null
  } else {
    status = 'idle'
    remainingMs = durationMs
    endsAt = null
    notified = false
  }

  return {
    id: typeof input.id === 'string' && input.id ? input.id : createTimerId(),
    durationMs,
    remainingMs,
    endsAt,
    status,
    repeatEnabled: Boolean(input.repeatEnabled),
    notified,
    ttsMessage: sanitizeTtsMessage(input.ttsMessage),
  }
}

function migrateLegacyStore(parsed: Record<string, unknown>): HuntAlertStore {
  return {
    version: HUNT_ALERT_STORE_VERSION,
    soundEnabled: parsed.soundEnabled !== false,
    notifyEnabled: parsed.notifyEnabled !== false,
    ttsEnabled: parsed.ttsEnabled !== false,
    ttsVoiceURI: normalizeHuntAlertVoiceId(parsed.ttsVoiceURI),
    volume: clampVolume(parsed.volume),
    timers: [
      normalizeTimer({
        durationMs: typeof parsed.durationMs === 'number' ? parsed.durationMs : DEFAULT_HUNT_ALERT_MS,
        remainingMs: typeof parsed.remainingMs === 'number' ? parsed.remainingMs : undefined,
        endsAt: typeof parsed.endsAt === 'number' ? parsed.endsAt : null,
        status: parsed.status as HuntAlertStatus | undefined,
        repeatEnabled: Boolean(parsed.repeatEnabled),
        notified: Boolean(parsed.notified),
      }),
    ],
  }
}

export function loadHuntAlertState(): HuntAlertStore {
  try {
    const raw = localStorage.getItem(HUNT_ALERT_STORAGE_KEY)
    if (!raw) {
      return {
        ...DEFAULT_HUNT_ALERT_STORE,
        timers: [createHuntAlertTimer(DEFAULT_HUNT_ALERT_MS, { repeatEnabled: false })],
      }
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (parsed.version === HUNT_ALERT_STORE_VERSION && Array.isArray(parsed.timers)) {
      const timers = (parsed.timers as Partial<HuntAlertTimer>[]).map(normalizeTimer).slice(0, MAX_HUNT_ALERT_TIMERS)
      return {
        version: HUNT_ALERT_STORE_VERSION,
        soundEnabled: parsed.soundEnabled !== false,
        notifyEnabled: parsed.notifyEnabled !== false,
        ttsEnabled: parsed.ttsEnabled !== false,
        ttsVoiceURI: normalizeHuntAlertVoiceId(parsed.ttsVoiceURI),
        volume: clampVolume(parsed.volume),
        timers: timers.length > 0 ? timers : [createHuntAlertTimer(DEFAULT_HUNT_ALERT_MS, { repeatEnabled: false })],
      }
    }
    return migrateLegacyStore(parsed)
  } catch {
    return {
      ...DEFAULT_HUNT_ALERT_STORE,
      timers: [createHuntAlertTimer(DEFAULT_HUNT_ALERT_MS, { repeatEnabled: false })],
    }
  }
}

export function persistHuntAlertState(state: HuntAlertStore) {
  localStorage.setItem(HUNT_ALERT_STORAGE_KEY, JSON.stringify(state))
}

export function playHuntAlertSound(volume = 0.8) {
  const level = clampVolume(volume)
  if (level <= 0) return
  const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) return
  const ctx = new AudioCtx()
  const peak = 0.12 * level
  const notes = [880, 1174.7, 1318.5]
  notes.forEach((freq, index) => {
    const start = ctx.currentTime + index * 0.2
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), start + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(start)
    osc.stop(start + 0.2)
  })
  window.setTimeout(() => {
    void ctx.close()
  }, 900)
}

export async function requestHuntAlertPermission() {
  if (typeof Notification === 'undefined' || Notification.permission !== 'default') {
    return typeof Notification === 'undefined' ? 'denied' : Notification.permission
  }
  return Notification.requestPermission()
}

export function showHuntAlertNotification(body: string, tag = 'laae-hunt-alert') {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  try {
    new Notification('사냥 알리미', { body, tag })
  } catch {
    // Safari 등에서 생성자 실패 시 무시
  }
}

export function canUseBrowserNotification() {
  return typeof Notification !== 'undefined'
}

export function canUseSpeechSynthesis() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function resolveHuntAlertTtsText(timer: HuntAlertTimer) {
  const custom = sanitizeTtsMessage(timer.ttsMessage)
  if (custom) return custom
  const label = formatDurationLabel(timer.durationMs)
  return timer.repeatEnabled ? `${label}마다 알림입니다` : `${label} 알림입니다`
}

const FEMALE_VOICE_RE = /heami|sunhi|yuna|seoyeon|insun|sora|nari|female|woman|여성|여자/
const MALE_VOICE_RE = /injoon|jinho|minjun|male|man|남성|남자/
const NATURAL_VOICE_RE = /neural|natural|online|premium|enhanced|google|sunhi|heami|yuna|seoyeon/

function isKoreanVoice(voice: SpeechSynthesisVoice) {
  const lang = voice.lang.toLowerCase()
  return lang.startsWith('ko') || lang.includes('kr')
}

function inferVoiceGender(name: string): HuntAlertVoiceOption['gender'] {
  const lower = name.toLowerCase()
  if (FEMALE_VOICE_RE.test(lower)) return 'female'
  if (MALE_VOICE_RE.test(lower)) return 'male'
  return 'unknown'
}

function scoreVoice(voice: SpeechSynthesisVoice) {
  const name = voice.name.toLowerCase()
  let score = 0
  if (isKoreanVoice(voice)) score += 40
  if (NATURAL_VOICE_RE.test(name)) score += 20
  if (!voice.localService) score += 12
  if (FEMALE_VOICE_RE.test(name)) score += 6
  if (name.includes('desktop') || name.includes('compact')) score -= 8
  return score
}

function toVoiceOption(voice: SpeechSynthesisVoice): HuntAlertVoiceOption {
  return {
    uri: voice.voiceURI,
    name: voice.name,
    lang: voice.lang,
    localService: voice.localService,
    gender: inferVoiceGender(voice.name),
    natural: NATURAL_VOICE_RE.test(voice.name.toLowerCase()) || !voice.localService,
  }
}

export function listHuntAlertVoices(): HuntAlertVoiceOption[] {
  if (!canUseSpeechSynthesis()) return []
  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.filter((voice) => isKoreanVoice(voice) || NATURAL_VOICE_RE.test(voice.name.toLowerCase()))
  const pool = preferred.length > 0 ? preferred : voices
  return [...pool].sort((a, b) => scoreVoice(b) - scoreVoice(a)).map(toVoiceOption)
}

export function formatHuntAlertVoiceLabel(voice: HuntAlertVoiceOption) {
  const tags: string[] = []
  if (voice.gender === 'female') tags.push('여성')
  if (voice.gender === 'male') tags.push('남성')
  if (voice.natural) tags.push('자연스러움')
  return tags.length > 0 ? `${voice.name} · ${tags.join(' · ')}` : voice.name
}

export function pickHuntAlertVoice(preferredURI?: string | null) {
  if (!canUseSpeechSynthesis()) return null
  const voices = window.speechSynthesis.getVoices()
  if (preferredURI) {
    const selected = voices.find((voice) => voice.voiceURI === preferredURI)
    if (selected) return selected
  }
  const korean = voices.filter(isKoreanVoice)
  const pool = korean.length > 0 ? korean : voices
  if (pool.length === 0) return null
  return [...pool].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] ?? null
}

export function speakHuntAlert(text: string, voiceURI?: string | null, volume = 0.8) {
  const spoken = text.trim()
  if (!spoken) return Promise.resolve()
  if (canUseSpeechSynthesis()) window.speechSynthesis.cancel()
  stopHuntTtsPlayback()

  return playHuntTtsClip(spoken, voiceURI, volume).catch(() => {
    speakBrowserHuntAlert(spoken, volume)
  })
}

function speakBrowserHuntAlert(spoken: string, volume = 0.8) {
  if (!canUseSpeechSynthesis()) {
    playHuntAlertSound(volume)
    return
  }
  const synth = window.speechSynthesis
  synth.cancel()

  let started = false
  const speakNow = () => {
    if (started) return
    started = true
    const utterance = new SpeechSynthesisUtterance(spoken)
    utterance.lang = 'ko-KR'
    utterance.rate = 0.96
    utterance.pitch = 1.04
    utterance.volume = clampVolume(volume)
    const voice = pickHuntAlertVoice()
    if (voice) {
      utterance.voice = voice
      utterance.lang = voice.lang || 'ko-KR'
    }
    synth.speak(utterance)
  }

  if (synth.getVoices().length === 0) {
    synth.addEventListener('voiceschanged', speakNow, { once: true })
    window.setTimeout(speakNow, 300)
    return
  }
  speakNow()
}
