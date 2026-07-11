import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const NEXON_API_BASE = 'https://open.api.nexon.com/maplestory/v1'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type MapleApiRequest =
  | { action: 'lookup-ocid'; character_name: string }
  | { action: 'character-basic'; ocid: string; date?: string }

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function getYesterdayKstYmd() {
  const now = new Date()
  const kst = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
  kst.setDate(kst.getDate() - 1)
  const y = kst.getFullYear()
  const m = String(kst.getMonth() + 1).padStart(2, '0')
  const d = String(kst.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

async function callNexon(path: string, params: Record<string, string>) {
  const apiKey = Deno.env.get('NEXON_OPEN_API_KEY')
  if (!apiKey) {
    throw new Error('NEXON_OPEN_API_KEY가 설정되지 않았습니다.')
  }

  const url = new URL(`${NEXON_API_BASE}${path}`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url.toString(), {
    headers: { 'x-nxopen-api-key': apiKey },
  })

  const text = await response.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { message: text }
  }

  if (!response.ok) {
    const message =
      typeof data === 'object' && data && 'message' in data
        ? String((data as { message: string }).message)
        : `Nexon API 오류 (${response.status})`
    throw new Error(message)
  }

  return data
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

  let body: MapleApiRequest
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: '요청 형식이 올바르지 않습니다.' }, 400)
  }

  try {
    if (body.action === 'lookup-ocid') {
      const characterName = body.character_name?.trim()
      if (!characterName) {
        return jsonResponse({ error: '캐릭터명이 필요합니다.' }, 400)
      }
      const data = await callNexon('/id', { character_name: characterName })
      return jsonResponse(data)
    }

    if (body.action === 'character-basic') {
      const ocid = body.ocid?.trim()
      if (!ocid) {
        return jsonResponse({ error: 'ocid가 필요합니다.' }, 400)
      }
      const date = body.date?.trim() || getYesterdayKstYmd()
      const data = await callNexon('/character/basic', { ocid, date })
      return jsonResponse(data)
    }

    return jsonResponse({ error: '지원하지 않는 action입니다.' }, 400)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Nexon API 호출에 실패했습니다.'
    return jsonResponse({ error: message }, 502)
  }
})
