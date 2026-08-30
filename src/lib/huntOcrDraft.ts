const STORAGE_PREFIX = 'laae-hunt-ocr-draft'
const DRAFT_VERSION = 1

export interface HuntOcrDraftSlot {
  imageDataUrl: string
  solErdaFragments: number
  meso: number
  fragmentInput: string
  mesoInput: string
  savedAt: string
}

export interface HuntOcrDraft {
  version: typeof DRAFT_VERSION
  before: HuntOcrDraftSlot | null
  after: HuntOcrDraftSlot | null
}

function draftKey(userId: string, characterId: string) {
  return `${STORAGE_PREFIX}:${userId}:${characterId}`
}

function stripImage(slot: HuntOcrDraftSlot | null): HuntOcrDraftSlot | null {
  if (!slot) return null
  return { ...slot, imageDataUrl: '' }
}

export function loadHuntOcrDraft(userId: string, characterId: string): HuntOcrDraft {
  const empty: HuntOcrDraft = { version: DRAFT_VERSION, before: null, after: null }
  try {
    const raw = localStorage.getItem(draftKey(userId, characterId))
    if (!raw) return empty
    const parsed = JSON.parse(raw) as Partial<HuntOcrDraft>
    if (parsed.version !== DRAFT_VERSION) return empty
    return {
      version: DRAFT_VERSION,
      before: parsed.before ?? null,
      after: parsed.after ?? null,
    }
  } catch {
    return empty
  }
}

export function saveHuntOcrDraft(userId: string, characterId: string, draft: HuntOcrDraft) {
  const key = draftKey(userId, characterId)
  try {
    localStorage.setItem(key, JSON.stringify(draft))
  } catch {
    try {
      localStorage.setItem(key, JSON.stringify({
        ...draft,
        before: stripImage(draft.before),
        after: stripImage(draft.after),
      }))
    } catch {
      // 브라우저 저장 공간이 부족하면 화면 상태만 유지합니다.
    }
  }
}

export function clearHuntOcrDraft(userId: string, characterId: string) {
  localStorage.removeItem(draftKey(userId, characterId))
}

export function formatHuntOcrSavedAt(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
