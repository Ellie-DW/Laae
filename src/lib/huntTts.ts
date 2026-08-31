import { supabase } from './supabase'

const MAX_TTS_LENGTH = 80

export const HUNT_TTS_VOICES = [
  { id: 'Kore', label: 'Kore · 또렷함', hint: '알림에 잘 맞는 기본 목소리' },
  { id: 'Aoede', label: 'Aoede · 부드럽게', hint: '조금 더 편안한 톤' },
  { id: 'Charon', label: 'Charon · 안내 톤', hint: '담담한 안내 방송' },
] as const

export type HuntTtsVoiceId = (typeof HUNT_TTS_VOICES)[number]['id']
export const DEFAULT_HUNT_TTS_VOICE: HuntTtsVoiceId = 'Kore'

const DB_NAME = 'laae-hunt-tts'
const STORE_NAME = 'clips'
const DB_VERSION = 1
const MAX_CACHE_ENTRIES = 80

interface HuntTtsError {
  error: string
}

interface HuntTtsClipRecord {
  key: string
  wav: ArrayBuffer
  createdAt: number
}

interface PlayJob {
  text: string
  voice: HuntTtsVoiceId
  volume: number
  resolve: () => void
  reject: (error: Error) => void
}

const memoryCache = new Map<string, ArrayBuffer>()
const inflight = new Map<string, Promise<ArrayBuffer>>()

let audioCtx: AudioContext | null = null
let currentSource: AudioBufferSourceNode | null = null
let generateTail: Promise<void> = Promise.resolve()
let playQueue: PlayJob[] = []
let draining = false
let playGeneration = 0

export function resolveHuntTtsVoice(value?: string | null): HuntTtsVoiceId {
  return HUNT_TTS_VOICES.some((voice) => voice.id === value) ? (value as HuntTtsVoiceId) : DEFAULT_HUNT_TTS_VOICE
}

export function canUseHuntAlertTts() {
  return typeof window !== 'undefined' && (typeof AudioContext !== 'undefined' || typeof (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext !== 'undefined')
}

function getAudioContext() {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!audioCtx) audioCtx = new Ctor()
  return audioCtx
}

export function prepareHuntAlertTts() {
  const ctx = getAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()
}

function cacheKey(text: string, voice: HuntTtsVoiceId) {
  return `${voice}\u0000${text}`
}

function copyBuffer(wav: ArrayBuffer) {
  return wav.slice(0)
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function runExclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = generateTail.then(fn, fn)
  generateTail = run.then(
    () => undefined,
    () => undefined
  )
  return run
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('음성 저장소를 열지 못했습니다.'))
  })
}

async function readCachedWav(key: string) {
  const hit = memoryCache.get(key)
  if (hit) return copyBuffer(hit)
  if (typeof indexedDB === 'undefined') return null
  try {
    const db = await openDb()
    const wav = await new Promise<ArrayBuffer | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const request = tx.objectStore(STORE_NAME).get(key)
      request.onsuccess = () => {
        const record = request.result as HuntTtsClipRecord | undefined
        resolve(record?.wav ?? null)
      }
      request.onerror = () => reject(request.error)
    })
    db.close()
    if (!wav) return null
    memoryCache.set(key, wav)
    return copyBuffer(wav)
  } catch {
    return null
  }
}

async function pruneCache(db: IDBDatabase) {
  const records = await new Promise<HuntTtsClipRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).getAll()
    request.onsuccess = () => resolve((request.result as HuntTtsClipRecord[]) ?? [])
    request.onerror = () => reject(request.error)
  })
  if (records.length < MAX_CACHE_ENTRIES) return
  const extra = [...records].sort((a, b) => a.createdAt - b.createdAt).slice(0, records.length - MAX_CACHE_ENTRIES + 1)
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    for (const record of extra) tx.objectStore(STORE_NAME).delete(record.key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function writeCachedWav(key: string, wav: ArrayBuffer) {
  memoryCache.set(key, wav)
  if (typeof indexedDB === 'undefined') return
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put({ key, wav: copyBuffer(wav), createdAt: Date.now() } satisfies HuntTtsClipRecord)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    await pruneCache(db)
    db.close()
  } catch {
    // 캐시 실패해도 재생은 진행
  }
}

async function functionErrorMessage(error: { message: string; context?: unknown }, payload: HuntTtsError | null) {
  if (payload?.error) return payload.error
  const context = error.context
  if (context instanceof Response) {
    try {
      const body = (await context.clone().json()) as HuntTtsError
      if (body?.error) return body.error
    } catch {
      // ignore
    }
  }
  if (context && typeof context === 'object' && 'error' in context && typeof (context as HuntTtsError).error === 'string') {
    return (context as HuntTtsError).error
  }
  return error.message
}

function decodeBase64Wav(value: string) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  const copy = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(copy).set(bytes)
  return copy
}

async function requestHuntTts(text: string, voice: HuntTtsVoiceId) {
  const { data, error } = await supabase.functions.invoke('hunt-tts', {
    body: { text, voice },
  })
  const payload = data as { audioBase64?: string } | HuntTtsError | null
  if (error) {
    throw new Error(await functionErrorMessage(error, payload && 'error' in payload ? payload : null))
  }
  if (payload && typeof payload === 'object' && 'error' in payload && payload.error) {
    throw new Error(payload.error)
  }
  const audioBase64 = payload && 'audioBase64' in payload ? payload.audioBase64 : ''
  if (!audioBase64) {
    throw new Error('음성을 받지 못했습니다.')
  }
  return decodeBase64Wav(audioBase64)
}

async function requestHuntTtsWithRetry(text: string, voice: HuntTtsVoiceId) {
  let lastError: Error | null = null
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await requestHuntTts(text, voice)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('음성 생성에 실패했습니다.')
      if (attempt < 2) await sleep(500 * 2 ** attempt)
    }
  }
  throw lastError ?? new Error('음성 생성에 실패했습니다.')
}

async function loadHuntTtsWav(text: string, voice: HuntTtsVoiceId) {
  const spoken = text.replace(/\s+/g, ' ').trim().slice(0, MAX_TTS_LENGTH)
  if (!spoken) throw new Error('읽을 말이 없습니다.')
  const key = cacheKey(spoken, voice)
  const cached = await readCachedWav(key)
  if (cached) return cached

  const pending = inflight.get(key)
  if (pending) return pending.then(copyBuffer)

  const request = runExclusive(() => requestHuntTtsWithRetry(spoken, voice))
    .then(async (wav) => {
      await writeCachedWav(key, wav)
      return wav
    })
    .finally(() => {
      inflight.delete(key)
    })
  inflight.set(key, request)
  return request.then(copyBuffer)
}

export async function prefetchHuntAlertTts(text: string, voiceURI?: string | null) {
  const spoken = text.replace(/\s+/g, ' ').trim()
  if (!spoken || !canUseHuntAlertTts()) return
  try {
    await loadHuntTtsWav(spoken, resolveHuntTtsVoice(voiceURI))
  } catch {
    // 미리 만들기에 실패하면 울릴 때 다시 시도
  }
}

function stopCurrentSource() {
  if (!currentSource) return
  try {
    currentSource.stop()
  } catch {
    // already stopped
  }
  currentSource = null
}

async function playWavBuffer(wav: ArrayBuffer, volume: number) {
  const ctx = getAudioContext()
  if (!ctx) throw new Error('이 브라우저는 음성 재생을 지원하지 않아요.')
  prepareHuntAlertTts()
  const buffer = await ctx.decodeAudioData(copyBuffer(wav))
  await new Promise<void>((resolve, reject) => {
    try {
      stopCurrentSource()
      const source = ctx.createBufferSource()
      const gain = ctx.createGain()
      gain.gain.value = Math.min(1, Math.max(0, volume))
      source.buffer = buffer
      source.connect(gain)
      gain.connect(ctx.destination)
      currentSource = source
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      let settled = false
      const finish = () => {
        if (settled) return
        settled = true
        if (currentSource === source) currentSource = null
        resolve()
      }
      source.onended = finish
      source.start()
      window.setTimeout(finish, Math.ceil(buffer.duration * 1000) + 400)
    } catch (err) {
      reject(err instanceof Error ? err : new Error('음성 재생에 실패했습니다.'))
    }
  })
}

async function drainPlayQueue() {
  if (draining) return
  draining = true
  try {
    while (playQueue.length > 0) {
      const job = playQueue.shift()
      if (!job) break
      const generation = playGeneration
      try {
        const wav = await loadHuntTtsWav(job.text, job.voice)
        if (generation !== playGeneration) {
          job.resolve()
          continue
        }
        await playWavBuffer(wav, job.volume)
        job.resolve()
      } catch (err) {
        job.reject(err instanceof Error ? err : new Error('음성 재생에 실패했습니다.'))
      }
    }
  } finally {
    draining = false
    if (playQueue.length > 0) void drainPlayQueue()
  }
}

export function enqueueHuntTtsPlay(text: string, voiceURI: string | null | undefined, volume: number, interrupt = true) {
  const spoken = text.replace(/\s+/g, ' ').trim().slice(0, MAX_TTS_LENGTH)
  if (!spoken) return Promise.resolve()
  prepareHuntAlertTts()
  return new Promise<void>((resolve, reject) => {
    if (interrupt) {
      playGeneration += 1
      for (const job of playQueue) job.resolve()
      playQueue = []
      stopCurrentSource()
    }
    playQueue.push({
      text: spoken,
      voice: resolveHuntTtsVoice(voiceURI),
      volume,
      resolve,
      reject,
    })
    void drainPlayQueue()
  })
}

export function stopHuntTtsPlayback() {
  playGeneration += 1
  for (const job of playQueue) job.resolve()
  playQueue = []
  stopCurrentSource()
}
