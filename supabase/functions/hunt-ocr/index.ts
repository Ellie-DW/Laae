import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_MODEL = 'gemini-3.1-flash-lite'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`
const MAX_IMAGE_CHARS = 3_500_000
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MESO_PROMPT = `
메이플스토리 인벤토리 화면에서 메소만 읽어줘.
화면에 보이는 메소 표기를 그대로 mesoKorean에 적어.
예: 235억 5949만 264
솔 에르다 조각은 읽지 마.
`.trim()

type HuntOcrRequest = {
  imageBase64?: string
  base64?: string
  mimeType?: string
}

type HuntOcrValues = {
  solErdaFragments: number
  meso: number
  mesoKorean: string
}

const JO = 1_000_000_000_000
const EOK = 100_000_000
const MAN = 10_000

function parseMesoKorean(value: string): number {
  const compact = value.trim().replace(/,/g, '').replace(/\s/g, '').replace(/메소$/i, '')
  if (!compact) return 0
  const sign = compact.startsWith('-') ? -1 : 1
  let rest = compact.replace(/^-/, '')
  let total = 0
  const take = (unit: string, multiplier: number) => {
    const match = rest.match(new RegExp(`^(\\d+(?:\\.\\d+)?)${unit}`))
    if (!match) return
    total += parseFloat(match[1]) * multiplier
    rest = rest.slice(match[0].length)
  }
  take('조', JO)
  take('억', EOK)
  take('만', MAN)
  if (rest) {
    const num = Number(rest)
    if (Number.isFinite(num)) total += num
  }
  return sign * Math.round(total)
}

function parseMesoFromOcr(mesoKorean: unknown, meso: unknown) {
  const korean = typeof mesoKorean === 'string' ? mesoKorean : typeof meso === 'string' ? meso : ''
  if (/[조억만]/.test(korean)) return Math.max(0, parseMesoKorean(korean))
  if (korean) {
    const digits = Number(korean.replace(/[^\d]/g, ''))
    if (Number.isFinite(digits) && digits > 0) return Math.round(digits)
  }
  return toNonNegInt(meso)
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function stripDataUrl(value: string) {
  const match = value.match(/^data:[^;]+;base64,(.+)$/)
  return match ? match[1] : value.replace(/\s/g, '')
}

function toNonNegInt(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.round(value))
  }
  if (typeof value === 'string') {
    const num = Number(value.replace(/[^\d.]/g, ''))
    if (Number.isFinite(num)) return Math.max(0, Math.round(num))
  }
  return 0
}

function parseOcrJson(text: string) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  return JSON.parse(cleaned) as {
    meso?: unknown
    mesoKorean?: unknown
  }
}

function extractGeminiText(data: unknown) {
  if (!data || typeof data !== 'object') return ''
  const candidates = (data as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }).candidates
  const parts = candidates?.[0]?.content?.parts ?? []
  return parts.map((part) => part.text ?? '').join('').trim()
}

function geminiErrorMessage(data: unknown, status: number) {
  if (typeof data === 'object' && data && 'error' in data) {
    return String((data as { error?: { message?: string } }).error?.message ?? `Gemini 오류 (${status})`)
  }
  return `Gemini 오류 (${status})`
}

async function requestGemini(contents: unknown[], schema: Record<string, unknown>): Promise<string> {
  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.')
  }

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    }),
  })

  const text = await response.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { message: text }
  }

  if (!response.ok) {
    throw new Error(geminiErrorMessage(data, response.status))
  }

  const modelText = extractGeminiText(data)
  if (!modelText) {
    throw new Error('화면에서 숫자를 읽지 못했습니다.')
  }
  return modelText
}

const MESO_SCHEMA = {
  type: 'OBJECT',
  properties: {
    mesoKorean: {
      type: 'STRING',
      description: '화면에 보이는 메소 그대로. 예: 235억 5949만 264',
    },
  },
  required: ['mesoKorean'],
}

async function callGemini(imageBase64: string, mimeType: string): Promise<HuntOcrValues> {
  const screenshot = { inlineData: { mimeType, data: imageBase64 } }
  const modelText = await requestGemini(
    [{ role: 'user', parts: [{ text: MESO_PROMPT }, screenshot] }],
    MESO_SCHEMA,
  )

  let parsed: ReturnType<typeof parseOcrJson>
  try {
    parsed = parseOcrJson(modelText)
  } catch {
    throw new Error('인식 결과를 해석하지 못했습니다.')
  }

  const mesoKorean = typeof parsed.mesoKorean === 'string' ? parsed.mesoKorean.trim() : ''
  return {
    solErdaFragments: 0,
    meso: parseMesoFromOcr(mesoKorean, parsed.meso),
    mesoKorean,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'POST만 지원합니다.' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: '로그인이 필요합니다.' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: 'Supabase 환경 변수가 없습니다.' }, 500)
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) {
    return jsonResponse({ error: '인증에 실패했습니다.' }, 401)
  }

  let body: HuntOcrRequest
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: '요청 형식이 올바르지 않습니다.' }, 400)
  }

  const mimeType = body.mimeType?.trim().toLowerCase() ?? ''
  const imageBase64 = stripDataUrl(body.imageBase64 || body.base64 || '')

  if (!ALLOWED_MIME.has(mimeType)) {
    return jsonResponse({ error: 'JPG, PNG, WEBP 이미지만 올릴 수 있습니다.' }, 400)
  }
  if (!imageBase64 || imageBase64.length > MAX_IMAGE_CHARS) {
    return jsonResponse({ error: '이미지가 없거나 너무 큽니다.' }, 400)
  }

  try {
    const result = await callGemini(imageBase64, mimeType)
    return jsonResponse(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : '스샷 인식에 실패했습니다.'
    console.error('hunt-ocr', message)
    return jsonResponse({ error: message }, 502)
  }
})
