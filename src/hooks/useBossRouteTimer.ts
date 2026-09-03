import { useCallback, useEffect, useRef, useState } from 'react'
import {
  readBossRouteTimer,
  writeBossRouteTimer,
  type BossRouteTimerState,
} from '../lib/bossRouteTime'

export function useBossRouteTimer() {
  const [timer, setTimer] = useState<BossRouteTimerState | null>(() => readBossRouteTimer())
  const [now, setNow] = useState(() => Date.now())
  const timerRef = useRef(timer)
  timerRef.current = timer

  useEffect(() => {
    writeBossRouteTimer(timer)
  }, [timer])

  useEffect(() => {
    if (!timer) return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [timer])

  const start = useCallback((characterId: string) => {
    setTimer({ characterId, startedAt: Date.now() })
    setNow(Date.now())
  }, [])

  const stop = useCallback(() => {
    const stopped = timerRef.current
    setTimer(null)
    return stopped
  }, [])

  const cancel = useCallback(() => {
    setTimer(null)
  }, [])

  return {
    timer,
    elapsedMs: timer ? Math.max(0, now - timer.startedAt) : 0,
    start,
    stop,
    cancel,
  }
}
