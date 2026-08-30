import { supabase } from './supabase'
import { formatMesoKorean, parseMesoKorean } from '../utils'

const MAX_SOURCE_BYTES = 15 * 1024 * 1024
const MAX_BASE64_CHARS = 3_500_000
const ALLOWED_SEND_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])

function normalizeMime(type: string) {
  const mime = type.trim().toLowerCase()
  return mime === 'image/jpg' ? 'image/jpeg' : mime
}

export interface HuntOcrResult {
  solErdaFragments: number
  meso: number
}

export interface HuntOcrSnapshot {
  solErdaFragments: number
  meso: number
}

export interface HuntOcrCompareHint {
  before: HuntOcrSnapshot
  after: HuntOcrSnapshot
  acquiredFragments: number
  acquiredMeso: number
  fragmentDropped: boolean
  mesoDropped: boolean
  mesoUnreliable: boolean
}

interface HuntOcrError {
  error: string
}

export function huntOcrCompare(before: HuntOcrSnapshot, after: HuntOcrSnapshot): HuntOcrCompareHint {
  const fragmentDelta = after.solErdaFragments - before.solErdaFragments
  const mesoDelta = after.meso - before.meso
  return {
    before,
    after,
    acquiredFragments: Math.max(0, fragmentDelta),
    acquiredMeso: Math.max(0, mesoDelta),
    fragmentDropped: fragmentDelta < 0,
    mesoDropped: mesoDelta < 0,
    mesoUnreliable: before.meso === 0 && after.meso > 0,
  }
}

/** 획득 메소 입력칸(억 단위)에 넣을 값 */
export function formatMesoEokInput(amount: number): string {
  if (amount <= 0) return ''
  const eok = amount / 100_000_000
  return eok.toFixed(8).replace(/\.?0+$/, '')
}

/** 인벤 메소. 게임에서 읽힌 조·억·만 표기를 그대로 보여 줍니다. */
export function formatMesoRawInput(amount: number): string {
  if (amount <= 0) return '0'
  return `${formatMesoKorean(amount)}메소`
}

export function parseMesoRawInput(value: string): number {
  const trimmed = value.trim()
  if (!trimmed) return 0
  if (/[조억만]/.test(trimmed)) return parseMesoKorean(trimmed)
  const num = Number(trimmed.replace(/[^\d]/g, ''))
  return Number.isFinite(num) ? num : 0
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(new Error('이미지를 읽지 못했습니다.'))
    reader.readAsDataURL(blob)
  })
}

export async function compressHuntScreenshot(file: Blob): Promise<{ base64: string; mimeType: string }> {
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('이미지가 너무 큽니다. 더 작은 스샷을 올려 주세요.')
  }

  const mime = normalizeMime(file.type) || 'image/png'
  if (!ALLOWED_SEND_MIME.has(mime)) {
    throw new Error('JPG, PNG, WEBP 이미지만 올릴 수 있습니다.')
  }

  const base64 = await blobToBase64(file)
  if (base64.length > MAX_BASE64_CHARS) {
    throw new Error('이미지가 너무 큽니다. 더 작은 스샷을 올려 주세요.')
  }

  return { base64, mimeType: mime }
}

async function functionErrorMessage(error: { message: string; context?: unknown }, payload: HuntOcrError | null) {
  if (payload?.error) return payload.error
  const context = error.context
  if (context instanceof Response) {
    try {
      const body = (await context.clone().json()) as HuntOcrError
      if (body?.error) return body.error
    } catch {
      // ignore
    }
  }
  if (context && typeof context === 'object') {
    if ('error' in context && typeof (context as HuntOcrError).error === 'string') {
      return (context as HuntOcrError).error
    }
  }
  return error.message
}

export async function parseHuntScreenshot(image: { base64: string; mimeType: string }): Promise<HuntOcrResult> {
  const { data, error } = await supabase.functions.invoke('hunt-ocr', {
    body: {
      imageBase64: image.base64,
      mimeType: image.mimeType,
    },
  })
  const payload = data as HuntOcrResult | HuntOcrError | null

  if (error) {
    throw new Error(await functionErrorMessage(error, payload && 'error' in payload ? payload : null))
  }

  if (payload && typeof payload === 'object' && 'error' in payload && payload.error) {
    throw new Error(payload.error)
  }

  if (
    !payload ||
    typeof payload !== 'object' ||
    (!('meso' in payload) && !('mesoKorean' in payload))
  ) {
    throw new Error('인식 결과가 올바르지 않습니다.')
  }

  const mesoKorean = 'mesoKorean' in payload && typeof (payload as { mesoKorean?: unknown }).mesoKorean === 'string'
    ? (payload as { mesoKorean: string }).mesoKorean
    : ''
  const meso = /[조억만]/.test(mesoKorean)
    ? parseMesoKorean(mesoKorean)
    : Math.max(0, Math.round(Number((payload as { meso?: unknown }).meso) || 0))

  return {
    solErdaFragments: 0,
    meso,
  }
}
