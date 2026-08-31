import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_MODEL = 'gemini-2.5-flash-preview-tts'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`
const MAX_TTS_LENGTH = 80
const SAMPLE_RATE = 24_000
const ALLOWED_VOICES = new Set(['Kore', 'Aoede', 'Charon'])

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type HuntTtsRequest = {
  text?: string
  voice?: string
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function geminiErrorMessage(data: unknown, status: number) {
  if (typeof data === 'object' && data && 'error' in data) {
    return String((data as { error?: { message?: string } }).error?.message ?? `Gemini 오류 (${status})`)
  }
  return `Gemini 오류 (${status})`
}

function decodeBase64(value: string) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function encodeBase64(bytes: Uint8Array) {
  const chunk = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function pcmToWav(pcm: Uint8Array, sampleRate = SAMPLE_RATE) {
  const header = new Uint8Array(44)
  const view = new DataView(header.buffer)
  const writeStr = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) header[offset + i] = value.charCodeAt(i)
  }
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + pcm.length, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, pcm.length, true)
  const wav = new Uint8Array(44 + pcm.length)
  wav.set(header, 0)
  wav.set(pcm, 44)
  return wav
}

function isWav(mimeType: string, bytes: Uint8Array) {
  if (mimeType.includes('wav')) return true
  if (bytes.length < 12) return false
  const header = String.fromCharCode(...bytes.subarray(0, 4))
  const wave = String.fromCharCode(...bytes.subarray(8, 12))
  return header === 'RIFF' && wave === 'WAVE'
}

function extractAudio(data: unknown): { base64: string; mimeType: string } | null {
  if (!data || typeof data !== 'object') return null
  const candidates = (data as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inlineData?: { data?: string; mimeType?: string }
          inline_data?: { data?: string; mime_type?: string }
        }>
      }
    }>
  }).candidates
  const parts = candidates?.[0]?.content?.parts ?? []
  for (const part of parts) {
    const inline = part.inlineData ?? part.inline_data
    const base64 = inline?.data
    if (!base64) continue
    return {
      base64,
      mimeType: inline.mimeType ?? inline.mime_type ?? '',
    }
  }
  return null
}

function buildPrompt(text: string) {
  return `Say in clear, natural Korean. Speak only the text after the colon: ${text}`
}

async function synthesize(text: string, voice: string) {
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
      contents: [{ role: 'user', parts: [{ text: buildPrompt(text) }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    }),
  })

  const raw = await response.text()
  let data: unknown = null
  try {
    data = raw ? JSON.parse(raw) : null
  } catch {
    data = { message: raw }
  }

  if (!response.ok) {
    throw new Error(geminiErrorMessage(data, response.status))
  }

  const audio = extractAudio(data)
  if (!audio) {
    throw new Error('음성을 만들지 못했습니다.')
  }

  const bytes = decodeBase64(audio.base64)
  const wav = isWav(audio.mimeType, bytes) ? bytes : pcmToWav(bytes)
  return encodeBase64(wav)
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

  let body: HuntTtsRequest
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: '요청 형식이 올바르지 않습니다.' }, 400)
  }

  const text = typeof body.text === 'string' ? body.text.replace(/\s+/g, ' ').trim().slice(0, MAX_TTS_LENGTH) : ''
  const voice = typeof body.voice === 'string' ? body.voice.trim() : ''
  if (!text) {
    return jsonResponse({ error: '읽을 말이 없습니다.' }, 400)
  }
  if (!ALLOWED_VOICES.has(voice)) {
    return jsonResponse({ error: '지원하지 않는 목소리입니다.' }, 400)
  }

  try {
    const audioBase64 = await synthesize(text, voice)
    return jsonResponse({ audioBase64, mimeType: 'audio/wav', voice })
  } catch (err) {
    const message = err instanceof Error ? err.message : '음성 생성에 실패했습니다.'
    console.error('hunt-tts', message)
    return jsonResponse({ error: message }, 502)
  }
})
