import { useEffect, useRef, useState, type RefObject } from 'react'
import {
  compressHuntScreenshot,
  formatMesoRawInput,
  huntOcrCompare,
  parseHuntScreenshot,
  parseMesoRawInput,
  type HuntOcrCompareHint,
  type HuntOcrResult,
  type HuntOcrSnapshot,
} from '../../lib/huntOcr'
import {
  clearHuntOcrDraft,
  formatHuntOcrSavedAt,
  loadHuntOcrDraft,
  saveHuntOcrDraft,
  type HuntOcrDraftSlot,
} from '../../lib/huntOcrDraft'
import { formatMesoKorean } from '../../utils'
import SolErdaIcon from './SolErdaIcon'
import MesoIcon from './MesoIcon'

type SlotId = 'before' | 'after'

interface SlotState {
  previewUrl: string | null
  parsing: boolean
  error: string | null
  result: HuntOcrResult | null
  fragmentInput: string
  mesoInput: string
  savedAt: string | null
}

interface HuntScreenshotFieldProps {
  userId: string
  characterId: string
  onResult: (hint: HuntOcrCompareHint | null) => void
}

const EMPTY_SLOT: SlotState = {
  previewUrl: null,
  parsing: false,
  error: null,
  result: null,
  fragmentInput: '',
  mesoInput: '',
  savedAt: null,
}

function fileFromClipboard(event: ClipboardEvent) {
  const items = event.clipboardData?.items
  if (!items) return null
  for (const item of items) {
    if (item.type.startsWith('image/')) return item.getAsFile()
  }
  return null
}

function revokeUrl(url: string | null) {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
}

function snapshotFromSlot(state: SlotState): HuntOcrSnapshot | null {
  if (!state.result && !state.fragmentInput && !state.mesoInput) return null
  return {
    solErdaFragments: Math.max(0, parseInt(state.fragmentInput.replace(/[^\d]/g, ''), 10) || 0),
    meso: parseMesoRawInput(state.mesoInput),
  }
}

function sanitizeMesoEdit(value: string) {
  return value.replace(/[^\d조억만메소,.\s-]/g, '')
}

function withMesoInput(prev: SlotState, value: string, format: boolean): SlotState {
  const meso = parseMesoRawInput(value)
  return {
    ...prev,
    mesoInput: format && meso > 0 ? formatMesoRawInput(meso) : value,
    result: {
      solErdaFragments: prev.result?.solErdaFragments ?? (parseInt(prev.fragmentInput.replace(/[^\d]/g, ''), 10) || 0),
      meso,
    },
  }
}

function slotFromDraft(draft: HuntOcrDraftSlot | null): SlotState {
  if (!draft) return EMPTY_SLOT
  return {
    previewUrl: draft.imageDataUrl || null,
    parsing: false,
    error: null,
    result: {
      solErdaFragments: draft.solErdaFragments,
      meso: draft.meso,
    },
    fragmentInput: draft.fragmentInput,
    mesoInput: draft.meso > 0 ? formatMesoRawInput(draft.meso) : draft.mesoInput,
    savedAt: draft.savedAt,
  }
}

function slotToDraft(state: SlotState): HuntOcrDraftSlot | null {
  const snap = snapshotFromSlot(state)
  if (!snap) return null
  return {
    imageDataUrl: state.previewUrl?.startsWith('data:') ? state.previewUrl : '',
    solErdaFragments: snap.solErdaFragments,
    meso: snap.meso,
    fragmentInput: state.fragmentInput,
    mesoInput: state.mesoInput,
    savedAt: state.savedAt ?? new Date().toISOString(),
  }
}

function isSlotReady(state: SlotState) {
  return Boolean(state.result || state.previewUrl || state.fragmentInput || state.mesoInput)
}

export default function HuntScreenshotField({ userId, characterId, onResult }: HuntScreenshotFieldProps) {
  const beforeInputRef = useRef<HTMLInputElement>(null)
  const afterInputRef = useRef<HTMLInputElement>(null)
  const [before, setBefore] = useState<SlotState>(EMPTY_SLOT)
  const [after, setAfter] = useState<SlotState>(EMPTY_SLOT)
  const [activeSlot, setActiveSlot] = useState<SlotId>('before')
  const [hint, setHint] = useState<HuntOcrCompareHint | null>(null)
  const [ready, setReady] = useState(false)

  const beforeRef = useRef(before)
  const afterRef = useRef(after)
  const activeSlotRef = useRef(activeSlot)
  const onResultRef = useRef(onResult)
  beforeRef.current = before
  afterRef.current = after
  activeSlotRef.current = activeSlot
  onResultRef.current = onResult

  useEffect(() => {
    const draft = loadHuntOcrDraft(userId, characterId)
    const nextBefore = slotFromDraft(draft.before)
    const nextAfter = slotFromDraft(draft.after)
    setBefore(nextBefore)
    setAfter(nextAfter)
    setActiveSlot(isSlotReady(nextBefore) ? 'after' : 'before')
    setHint(null)
    setReady(true)
    return () => {
      revokeUrl(beforeRef.current.previewUrl)
      revokeUrl(afterRef.current.previewUrl)
    }
  }, [userId, characterId])

  useEffect(() => {
    if (!ready) return
    saveHuntOcrDraft(userId, characterId, {
      version: 1,
      before: slotToDraft(before),
      after: slotToDraft(after),
    })
  }, [ready, userId, characterId, before, after])

  useEffect(() => {
    const beforeSnap = snapshotFromSlot(before)
    const afterSnap = snapshotFromSlot(after)
    if (!beforeSnap || !afterSnap) {
      setHint(null)
      return
    }
    const next = huntOcrCompare(beforeSnap, afterSnap)
    setHint(next)
    onResultRef.current(next)
  }, [before, after])

  const setSlot = (slot: SlotId, update: SlotState | ((prev: SlotState) => SlotState)) => {
    if (slot === 'before') {
      setBefore(update)
      return
    }
    setAfter(update)
  }

  const clearSlot = (slot: SlotId) => {
    const current = slot === 'before' ? before : after
    revokeUrl(current.previewUrl)
    setSlot(slot, EMPTY_SLOT)
    if (slot === 'before') setActiveSlot('before')
    const input = slot === 'before' ? beforeInputRef.current : afterInputRef.current
    if (input) input.value = ''
    onResult(null)
  }

  const clearAll = () => {
    revokeUrl(before.previewUrl)
    revokeUrl(after.previewUrl)
    setBefore(EMPTY_SLOT)
    setAfter(EMPTY_SLOT)
    setHint(null)
    setActiveSlot('before')
    onResult(null)
    clearHuntOcrDraft(userId, characterId)
    if (beforeInputRef.current) beforeInputRef.current.value = ''
    if (afterInputRef.current) afterInputRef.current.value = ''
  }

  const handleFile = async (slot: SlotId, file: File | null) => {
    if (slot === 'after' && !isSlotReady(beforeRef.current)) return
    const current = slot === 'before' ? beforeRef.current : afterRef.current
    if (!file || current.parsing) return
    if (!file.type.startsWith('image/')) {
      setSlot(slot, { ...current, error: '이미지 파일만 올릴 수 있어요' })
      return
    }

    revokeUrl(current.previewUrl)
    setSlot(slot, {
      previewUrl: URL.createObjectURL(file),
      parsing: true,
      error: null,
      result: null,
      fragmentInput: current.fragmentInput,
      mesoInput: '',
      savedAt: null,
    })
    setActiveSlot(slot)

    try {
      const image = await compressHuntScreenshot(file)
      const parsed = await parseHuntScreenshot(image)
      const dataUrl = `data:${image.mimeType};base64,${image.base64}`
      setSlot(slot, (prev) => {
        revokeUrl(prev.previewUrl)
        return {
          ...prev,
          previewUrl: dataUrl,
          parsing: false,
          result: parsed,
          error: null,
          fragmentInput: prev.fragmentInput,
          mesoInput: formatMesoRawInput(parsed.meso),
          savedAt: new Date().toISOString(),
        }
      })
      if (slot === 'before' && !isSlotReady(afterRef.current)) setActiveSlot('after')
    } catch (err) {
      const message = err instanceof Error ? err.message : '스샷 인식에 실패했습니다.'
      setSlot(slot, (prev) => ({ ...prev, parsing: false, result: null, error: message }))
    }
  }

  const handleFileRef = useRef(handleFile)
  handleFileRef.current = handleFile

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const file = fileFromClipboard(event)
      if (!file) return
      event.preventDefault()
      const beforeSlot = beforeRef.current
      const afterSlot = afterRef.current
      if (beforeSlot.parsing || afterSlot.parsing) return
      const slot: SlotId = !isSlotReady(beforeSlot)
        ? 'before'
        : activeSlotRef.current === 'before'
          ? 'before'
          : 'after'
      void handleFileRef.current(slot, file)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [])

  const renderSlot = (slot: SlotId, state: SlotState, inputRef: RefObject<HTMLInputElement>) => {
    const isBefore = slot === 'before'
    const label = isBefore ? '사냥 전' : '사냥 후'
    const locked = !isBefore && !isSlotReady(before)
    const filled = Boolean(state.previewUrl || state.result)
    const active = activeSlot === slot && !locked
    const stepTone = isBefore
      ? 'bg-cyber-500/20 text-cyber-300'
      : locked
        ? 'bg-dark-surface text-slate-600'
        : 'bg-violet-500/20 text-violet-300'

    return (
      <div
        className={`rounded-xl border p-3 space-y-3 transition-colors ${
          locked
            ? 'border-dark-border/70 bg-dark-bg/30'
            : filled
              ? isBefore
                ? 'border-cyber-500/25 bg-cyber-500/5'
                : 'border-violet-500/25 bg-violet-500/5'
              : active
                ? 'border-cyber-500/35 bg-dark-surface/50'
                : 'border-dark-border bg-dark-surface/30'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${stepTone}`}>
              {isBefore ? '1' : '2'}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-100">{label}</p>
              <p className="text-[11px] text-slate-500 truncate">
                {state.savedAt
                  ? `${formatHuntOcrSavedAt(state.savedAt)}에 저장됨`
                  : isBefore
                    ? '사냥 시작 전 인벤'
                    : '사냥이 끝난 뒤 인벤'}
              </p>
            </div>
          </div>
          {(state.result || state.previewUrl) && !state.parsing && (
            <button
              type="button"
              onClick={() => clearSlot(slot)}
              className="shrink-0 text-[11px] px-2 py-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-400/10"
            >
              지우기
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            if (locked) return
            setActiveSlot(slot)
            inputRef.current?.click()
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            if (locked) return
            setActiveSlot(slot)
            void handleFile(slot, event.dataTransfer.files[0] ?? null)
          }}
          disabled={state.parsing || locked}
          className="relative w-full h-32 rounded-lg overflow-hidden border border-dashed border-dark-border/80 bg-dark-bg/50 text-left disabled:cursor-not-allowed"
        >
          {state.previewUrl ? (
            <img src={state.previewUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-3">
              <div className="w-10 h-10 rounded-full bg-dark-surface/80 border border-dark-border flex items-center justify-center">
                <SolErdaIcon size="sm" />
              </div>
              <p className="text-xs text-slate-300 text-center">
                {locked ? '사냥 전을 먼저 올려 주세요' : '기타칸이 보이게 올려 주세요'}
              </p>
              {!locked && <p className="text-[11px] text-slate-500">클릭 · 끌어다 놓기 · Ctrl+V</p>}
            </div>
          )}
          {state.parsing && (
            <div className="absolute inset-0 bg-dark-bg/70 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-cyber-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-300">스샷 읽는 중...</p>
            </div>
          )}
          {state.previewUrl && !state.parsing && (
            <span className="absolute bottom-2 left-2 text-[10px] px-1.5 py-0.5 rounded bg-dark-bg/80 text-slate-300">
              다시 올리려면 클릭
            </span>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            void handleFile(slot, event.target.files?.[0] ?? null)
          }}
        />
        {state.error && <p className="text-xs text-red-400">{state.error}</p>}

        <div className="space-y-2">
          <label className="block">
            <span className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
              <MesoIcon size="xs" />
              메소
            </span>
            <input
              value={state.mesoInput}
              onChange={(event) => {
                const value = sanitizeMesoEdit(event.target.value)
                setSlot(slot, (prev) => withMesoInput(prev, value, false))
              }}
              onBlur={() => {
                setSlot(slot, (prev) => withMesoInput(prev, prev.mesoInput, true))
              }}
              inputMode="text"
              autoComplete="off"
              placeholder="예: 335억 5,683만 5,282메소"
              className="input-field text-sm tabular-nums"
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
              <SolErdaIcon size="xs" />
              솔 에르다 조각
            </span>
            <input
              value={state.fragmentInput}
              onChange={(event) => {
                const value = event.target.value.replace(/[^\d]/g, '')
                const fragments = Math.max(0, parseInt(value, 10) || 0)
                setSlot(slot, (prev) => ({
                  ...prev,
                  fragmentInput: value,
                  result: {
                    solErdaFragments: fragments,
                    meso: prev.result?.meso ?? parseMesoRawInput(prev.mesoInput),
                  },
                }))
              }}
              inputMode="numeric"
              placeholder="0"
              className="input-field text-sm tabular-nums"
            />
          </label>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">인벤 스샷 비교</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            1번을 올려 두고 사냥한 뒤, 돌아와서 2번을 올리세요. (조각은 수기작성)
          </p>
        </div>
        {(isSlotReady(before) || isSlotReady(after)) && (
          <button
            type="button"
            onClick={clearAll}
            className="shrink-0 text-[11px] text-slate-500 hover:text-slate-300"
          >
            초기화
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {renderSlot('before', before, beforeInputRef)}
        {renderSlot('after', after, afterInputRef)}
      </div>

      {isSlotReady(before) && !isSlotReady(after) && (
        <div className="rounded-lg border border-cyber-500/20 bg-cyber-500/10 px-3 py-2 text-xs text-cyber-200">
          사냥 전이 이 캐릭터에 저장됐어요. 끝나고 사냥 후 스샷만 올리면 됩니다.
        </div>
      )}

      {hint && (
        <div className="rounded-xl border border-cyber-500/25 bg-gradient-to-br from-cyber-500/10 to-violet-500/10 px-4 py-3 space-y-3">
          <p className="text-xs font-medium text-slate-400">이번 획득 · 틀리면 위 숫자를 고치세요</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-dark-bg/40 px-3 py-2.5">
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <MesoIcon size="xs" />
                메소
              </p>
              <p className="text-lg font-bold text-cyber-400 mt-0.5 leading-tight">
                {hint.acquiredMeso > 0 ? `+${formatMesoKorean(hint.acquiredMeso)}` : '변동 없음'}
              </p>
            </div>
            <div className="rounded-lg bg-dark-bg/40 px-3 py-2.5">
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <SolErdaIcon size="xs" />
                솔 에르다 조각
              </p>
              <p className="text-lg font-bold text-violet-400 mt-0.5 leading-tight">
                {hint.acquiredFragments > 0 ? `+${hint.acquiredFragments.toLocaleString()}개` : '변동 없음'}
              </p>
            </div>
          </div>
          {hint.fragmentDropped && (
            <p className="text-xs text-amber-400">사냥 후 조각이 더 적어요. 사용·판매를 따로 기록해 주세요.</p>
          )}
          {hint.mesoDropped && (
            <p className="text-xs text-amber-400">사냥 후 메소가 더 적어요. 사냥 중 지출이 있으면 획득 메소를 직접 넣어 주세요.</p>
          )}
          {hint.mesoUnreliable && (
            <p className="text-xs text-amber-400">
              사냥 전 메소가 0으로 읽혔어요. 위 숫자를 고치면 획득량이 다시 계산됩니다.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
