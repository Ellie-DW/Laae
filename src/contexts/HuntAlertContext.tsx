import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { SITE_NAME, SITE_TAGLINE } from '../lib/site'
import {
  MAX_HUNT_ALERT_TIMERS,
  canUseBrowserNotification,
  clampDurationMs,
  clampVolume,
  createHuntAlertTimer,
  formatCountdown,
  getSoonestRunningTimer,
  hasActiveHuntAlert,
  loadHuntAlertState,
  persistHuntAlertState,
  playHuntAlertSound,
  remainingFromEndsAt,
  requestHuntAlertPermission,
  resolveHuntAlertTtsText,
  clampTtsMessageInput,
  showHuntAlertNotification,
  speakHuntAlert,
  normalizeHuntAlertVoiceId,
  type HuntAlertStore,
  type HuntAlertTimer,
} from '../lib/huntAlert'
import { prefetchHuntAlertTts, prepareHuntAlertTts } from '../lib/huntTts'

const DEFAULT_TITLE = `${SITE_NAME} - ${SITE_TAGLINE}`

interface HuntAlertContextValue {
  timers: HuntAlertTimer[]
  soundEnabled: boolean
  notifyEnabled: boolean
  ttsEnabled: boolean
  ttsVoiceURI: string
  volume: number
  addTimer: () => void
  removeTimer: (id: string) => void
  setDuration: (id: string, ms: number) => void
  start: (id: string) => Promise<void>
  pause: (id: string) => void
  resume: (id: string) => void
  reset: (id: string) => void
  startAll: () => Promise<void>
  pauseAll: () => void
  setRepeatEnabled: (id: string, enabled: boolean) => void
  setTtsMessage: (id: string, message: string) => void
  setSoundEnabled: (enabled: boolean) => void
  setNotifyEnabled: (enabled: boolean) => void
  setTtsEnabled: (enabled: boolean) => void
  setTtsVoiceURI: (voiceURI: string) => void
  setVolume: (volume: number) => void
}

const HuntAlertContext = createContext<HuntAlertContextValue | null>(null)

interface HuntAlertProviderProps {
  children: ReactNode
  characterName?: string | null
  enabled?: boolean
}

function updateTimer(store: HuntAlertStore, id: string, updater: (timer: HuntAlertTimer) => HuntAlertTimer) {
  return {
    ...store,
    timers: store.timers.map((timer) => (timer.id === id ? updater(timer) : timer)),
  }
}

export function HuntAlertProvider({ children, characterName, enabled = true }: HuntAlertProviderProps) {
  const [state, setState] = useState<HuntAlertStore>(loadHuntAlertState)
  const characterNameRef = useRef(characterName ?? null)
  const completingIdsRef = useRef(new Set<string>())
  const persistRef = useRef(state)
  persistRef.current = state

  useEffect(() => {
    characterNameRef.current = characterName ?? null
  }, [characterName])

  const fireComplete = useCallback((timer: HuntAlertTimer, extras: { soundEnabled: boolean; notifyEnabled: boolean; ttsEnabled: boolean; ttsVoiceURI: string; volume: number }) => {
    if (timer.notified) return timer
    const spoken = resolveHuntAlertTtsText(timer)
    if (extras.ttsEnabled) void speakHuntAlert(spoken, extras.ttsVoiceURI, extras.volume, false)
    else if (extras.soundEnabled) playHuntAlertSound(extras.volume)
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(400)
    }
    if (extras.notifyEnabled) {
      const who = characterNameRef.current
      const body = who ? `${who} · ${spoken}` : spoken
      showHuntAlertNotification(body, `laae-hunt-alert-${timer.id}`)
    }
    return { ...timer, notified: true }
  }, [])

  const persistKey = state.timers
    .map((timer) => `${timer.id}:${timer.status}:${timer.endsAt}:${timer.durationMs}:${timer.repeatEnabled}:${timer.notified}:${timer.ttsMessage}`)
    .join('|')

  const ttsPrefetchKey = state.timers
    .map((timer) => `${timer.id}:${timer.durationMs}:${timer.repeatEnabled}:${timer.ttsMessage}`)
    .join('|')

  useEffect(() => {
    if (!enabled) return
    persistHuntAlertState(persistRef.current)
  }, [enabled, persistKey, state.soundEnabled, state.notifyEnabled, state.ttsEnabled, state.ttsVoiceURI, state.volume])

  useEffect(() => {
    if (!enabled || !state.ttsEnabled) return
    prepareHuntAlertTts()
    for (const timer of persistRef.current.timers) {
      void prefetchHuntAlertTts(resolveHuntAlertTtsText(timer), state.ttsVoiceURI)
    }
  }, [enabled, state.ttsEnabled, state.ttsVoiceURI, ttsPrefetchKey])

  useEffect(() => {
    if (!enabled) return
    setState((prev) => {
      let changed = false
      const timers = prev.timers.map((timer) => {
        if (timer.status === 'done' && !timer.notified) {
          changed = true
          return fireComplete(timer, prev)
        }
        return timer
      })
      return changed ? { ...prev, timers } : prev
    })
  }, [enabled, fireComplete, persistKey])

  const anyRunning = state.timers.some((timer) => timer.status === 'running' && timer.endsAt)

  useEffect(() => {
    if (!enabled || !anyRunning) return

    const tick = () => {
      setState((prev) => {
        let changed = false
        const timers = prev.timers.map((timer) => {
          if (timer.status !== 'running' || !timer.endsAt) return timer
          const remaining = remainingFromEndsAt(timer.endsAt)
          if (remaining > 0) {
            if (timer.remainingMs === remaining) return timer
            changed = true
            return { ...timer, remainingMs: remaining }
          }
          if (completingIdsRef.current.has(timer.id)) return timer
          completingIdsRef.current.add(timer.id)
          changed = true
          const finished = fireComplete(
            { ...timer, remainingMs: 0, endsAt: null, status: 'done' },
            prev
          )
          if (!finished.repeatEnabled) return finished
          completingIdsRef.current.delete(timer.id)
          return {
            ...finished,
            remainingMs: finished.durationMs,
            endsAt: Date.now() + finished.durationMs,
            status: 'running' as const,
            notified: false,
          }
        })
        return changed ? { ...prev, timers } : prev
      })
    }

    tick()
    const id = window.setInterval(tick, 250)
    const onVisibility = () => {
      prepareHuntAlertTts()
      tick()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [enabled, anyRunning, fireComplete])

  useEffect(() => {
    if (!enabled) {
      document.title = DEFAULT_TITLE
      return
    }
    const doneCount = state.timers.filter((timer) => timer.status === 'done').length
    const running = state.timers.filter((timer) => timer.status === 'running')
    const paused = state.timers.filter((timer) => timer.status === 'paused')
    const soonest = getSoonestRunningTimer(state.timers)

    if (doneCount > 0) {
      document.title = `알림 ${doneCount} · ${SITE_NAME}`
    } else if (soonest) {
      const prefix = formatCountdown(soonest.remainingMs)
      document.title = running.length > 1 ? `${prefix} ×${running.length} · ${SITE_NAME}` : `${prefix} · ${SITE_NAME}`
    } else if (paused.length > 0) {
      document.title = `일시정지 · ${SITE_NAME}`
    } else {
      document.title = DEFAULT_TITLE
    }
  }, [enabled, state.timers])

  useEffect(() => {
    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [])

  const requestNotify = useCallback(async () => {
    if (state.notifyEnabled && canUseBrowserNotification()) {
      await requestHuntAlertPermission()
    }
  }, [state.notifyEnabled])

  const addTimer = useCallback(() => {
    setState((prev) => {
      if (prev.timers.length >= MAX_HUNT_ALERT_TIMERS) return prev
      return { ...prev, timers: [...prev.timers, createHuntAlertTimer(30 * 60 * 1000)] }
    })
  }, [])

  const removeTimer = useCallback((id: string) => {
    completingIdsRef.current.delete(id)
    setState((prev) => ({ ...prev, timers: prev.timers.filter((timer) => timer.id !== id) }))
  }, [])

  const setDuration = useCallback((id: string, ms: number) => {
    const durationMs = clampDurationMs(ms)
    setState((prev) =>
      updateTimer(prev, id, (timer) => {
        if (timer.status === 'running' || timer.status === 'paused') return timer
        completingIdsRef.current.delete(id)
        return {
          ...timer,
          durationMs,
          remainingMs: durationMs,
          endsAt: null,
          status: 'idle',
          notified: false,
        }
      })
    )
  }, [])

  const prefetchTimer = useCallback((timer: HuntAlertTimer, ttsEnabled: boolean, voiceURI: string) => {
    if (!ttsEnabled) return
    prepareHuntAlertTts()
    void prefetchHuntAlertTts(resolveHuntAlertTtsText(timer), voiceURI)
  }, [])

  const startTimer = useCallback((timer: HuntAlertTimer) => {
    completingIdsRef.current.delete(timer.id)
    const durationMs = clampDurationMs(timer.durationMs)
    return {
      ...timer,
      durationMs,
      remainingMs: durationMs,
      endsAt: Date.now() + durationMs,
      status: 'running' as const,
      notified: false,
    }
  }, [])

  const start = useCallback(
    async (id: string) => {
      await requestNotify()
      const current = persistRef.current
      const timer = current.timers.find((item) => item.id === id)
      if (timer) prefetchTimer(timer, current.ttsEnabled, current.ttsVoiceURI)
      setState((prev) => updateTimer(prev, id, startTimer))
    },
    [prefetchTimer, requestNotify, startTimer]
  )

  const pause = useCallback((id: string) => {
    setState((prev) =>
      updateTimer(prev, id, (timer) => {
        if (timer.status !== 'running') return timer
        const remainingMs = timer.endsAt ? remainingFromEndsAt(timer.endsAt) : timer.remainingMs
        return { ...timer, remainingMs, endsAt: null, status: 'paused' }
      })
    )
  }, [])

  const resume = useCallback((id: string) => {
    const current = persistRef.current
    const timer = current.timers.find((item) => item.id === id)
    if (timer) prefetchTimer(timer, current.ttsEnabled, current.ttsVoiceURI)
    setState((prev) =>
      updateTimer(prev, id, (item) => {
        if (item.status !== 'paused' || item.remainingMs <= 0) return item
        completingIdsRef.current.delete(id)
        return {
          ...item,
          endsAt: Date.now() + item.remainingMs,
          status: 'running',
        }
      })
    )
  }, [prefetchTimer])

  const reset = useCallback((id: string) => {
    completingIdsRef.current.delete(id)
    setState((prev) =>
      updateTimer(prev, id, (timer) => ({
        ...timer,
        remainingMs: timer.durationMs,
        endsAt: null,
        status: 'idle',
        notified: false,
      }))
    )
  }, [])

  const startAll = useCallback(async () => {
    await requestNotify()
    const current = persistRef.current
    current.timers.forEach((timer) => prefetchTimer(timer, current.ttsEnabled, current.ttsVoiceURI))
    setState((prev) => ({
      ...prev,
      timers: prev.timers.map((timer) => {
        if (timer.status === 'running') return timer
        if (timer.status === 'paused' && timer.remainingMs > 0) {
          completingIdsRef.current.delete(timer.id)
          return {
            ...timer,
            endsAt: Date.now() + timer.remainingMs,
            status: 'running' as const,
          }
        }
        return startTimer(timer)
      }),
    }))
  }, [prefetchTimer, requestNotify, startTimer])

  const pauseAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      timers: prev.timers.map((timer) => {
        if (timer.status !== 'running') return timer
        const remainingMs = timer.endsAt ? remainingFromEndsAt(timer.endsAt) : timer.remainingMs
        return { ...timer, remainingMs, endsAt: null, status: 'paused' as const }
      }),
    }))
  }, [])

  const setRepeatEnabled = useCallback((id: string, repeatEnabled: boolean) => {
    setState((prev) => updateTimer(prev, id, (timer) => ({ ...timer, repeatEnabled })))
  }, [])

  const setTtsMessage = useCallback((id: string, message: string) => {
    setState((prev) => updateTimer(prev, id, (timer) => ({ ...timer, ttsMessage: clampTtsMessageInput(message) })))
  }, [])

  const setSoundEnabled = useCallback((soundEnabled: boolean) => {
    setState((prev) => ({ ...prev, soundEnabled }))
  }, [])

  const setNotifyEnabled = useCallback((notifyEnabled: boolean) => {
    setState((prev) => ({ ...prev, notifyEnabled }))
  }, [])

  const setTtsEnabled = useCallback((ttsEnabled: boolean) => {
    setState((prev) => ({ ...prev, ttsEnabled }))
  }, [])

  const setTtsVoiceURI = useCallback((ttsVoiceURI: string) => {
    setState((prev) => ({ ...prev, ttsVoiceURI: normalizeHuntAlertVoiceId(ttsVoiceURI) }))
  }, [])

  const setVolume = useCallback((volume: number) => {
    setState((prev) => ({ ...prev, volume: clampVolume(volume) }))
  }, [])

  const value = useMemo<HuntAlertContextValue>(
    () => ({
      timers: state.timers,
      soundEnabled: state.soundEnabled,
      notifyEnabled: state.notifyEnabled,
      ttsEnabled: state.ttsEnabled,
      ttsVoiceURI: state.ttsVoiceURI,
      volume: state.volume,
      addTimer,
      removeTimer,
      setDuration,
      start,
      pause,
      resume,
      reset,
      startAll,
      pauseAll,
      setRepeatEnabled,
      setTtsMessage,
      setSoundEnabled,
      setNotifyEnabled,
      setTtsEnabled,
      setTtsVoiceURI,
      setVolume,
    }),
    [
      state.timers,
      state.soundEnabled,
      state.notifyEnabled,
      state.ttsEnabled,
      state.ttsVoiceURI,
      state.volume,
      addTimer,
      removeTimer,
      setDuration,
      start,
      pause,
      resume,
      reset,
      startAll,
      pauseAll,
      setRepeatEnabled,
      setTtsMessage,
      setSoundEnabled,
      setNotifyEnabled,
      setTtsEnabled,
      setTtsVoiceURI,
      setVolume,
    ]
  )

  return <HuntAlertContext.Provider value={value}>{children}</HuntAlertContext.Provider>
}

export function useHuntAlert() {
  const ctx = useContext(HuntAlertContext)
  if (!ctx) throw new Error('useHuntAlert must be used within HuntAlertProvider')
  return ctx
}

export function useHuntAlertActive() {
  const { timers } = useHuntAlert()
  return hasActiveHuntAlert(timers)
}
