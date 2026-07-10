const STORAGE_KEY = 'maple-diary-data'
const KOREA_TZ = 'Asia/Seoul'

/** 한국(KST) 기준 YYYY-MM-DD */
export function getKoreaYMD(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: KOREA_TZ }).format(date)
}

/** 한국(KST) 기준 요일 (0=일, 4=목) */
function getKoreaDayOfWeek(date = new Date()): number {
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: KOREA_TZ, weekday: 'short' }).format(date)
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return map[weekday] ?? 0
}

function addDaysYMD(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const utc = new Date(Date.UTC(y, m - 1, d + days))
  const yy = utc.getUTCFullYear()
  const mm = String(utc.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(utc.getUTCDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

/** 메소를 억·만·나머지 형식으로 표시 (예: 28억4150만1024) */
export function formatMesoKorean(amount: number): string {
  if (amount === 0) return '0'
  const sign = amount < 0 ? '-' : ''
  let abs = Math.abs(Math.round(amount))

  const eok = Math.floor(abs / 100_000_000)
  abs %= 100_000_000
  const man = Math.floor(abs / 10_000)
  const rest = abs % 10_000

  const parts: string[] = []
  if (eok > 0) parts.push(`${eok}억`)
  if (man > 0) parts.push(`${man}만`)
  if (rest > 0) parts.push(`${rest}`)

  if (parts.length === 0) return '0'
  return `${sign}${parts.join('')}`
}

export function formatMeso(amount: number): string {
  return formatMesoKorean(amount)
}

export function parseMesoInput(value: string): number {
  const trimmed = value.trim().toLowerCase().replace(/,/g, '')
  if (!trimmed) return 0

  const eokMatch = trimmed.match(/^([\d.]+)\s*억$/)
  if (eokMatch) return Math.round(parseFloat(eokMatch[1]) * 100_000_000)

  const manMatch = trimmed.match(/^([\d.]+)\s*만$/)
  if (manMatch) return Math.round(parseFloat(manMatch[1]) * 10_000)

  const match = trimmed.match(/^([\d.]+)\s*([bkm])?$/)
  if (!match) {
    const num = parseFloat(trimmed)
    return Number.isFinite(num) ? Math.round(num * 100_000_000) : 0
  }
  const num = parseFloat(match[1])
  const unit = match[2]
  switch (unit) {
    case 'b': return Math.round(num * 1_000_000_000)
    case 'm': return Math.round(num * 1_000_000)
    case 'k': return Math.round(num * 1_000)
    default: return Math.round(num * 100_000_000)
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function getToday(): string {
  return getKoreaYMD(new Date())
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '')
}

/** 한국(KST) 기준 주간 기간 — 목요일 00:00 ~ 수요일 23:59 */
export function getWeeklyPeriod(date = new Date()): { start: string; end: string; label: string } {
  const todayKorea = getKoreaYMD(date)
  const day = getKoreaDayOfWeek(date)
  const diff = (day + 3) % 7
  const startStr = addDaysYMD(todayKorea, -diff)
  const endStr = addDaysYMD(startStr, 6)
  return { start: startStr, end: endStr, label: `${startStr} ~ ${endStr}` }
}

export function getMonthlyPeriod(date = new Date()): { start: string; end: string; label: string } {
  const ymd = getKoreaYMD(date)
  const [year, month] = ymd.split('-')
  const lastDay = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate()
  const startStr = `${year}-${month}-01`
  const endStr = `${year}-${month}-${String(lastDay).padStart(2, '0')}`
  return { start: startStr, end: endStr, label: `${startStr} ~ ${endStr}` }
}

export function getCurrentMonth(date = new Date()): string {
  return getKoreaYMD(date).slice(0, 7)
}

export const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  NORMAL: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  HARD: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  EXTREME: 'bg-red-500/20 text-red-400 border-red-500/30',
  CHAOS: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

export { STORAGE_KEY }

export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message
  if (typeof err === 'object' && err && 'message' in err) {
    const message = (err as { message: unknown }).message
    if (typeof message === 'string' && message) return message
  }
  return fallback
}
