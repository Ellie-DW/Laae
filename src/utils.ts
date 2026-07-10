const STORAGE_KEY = 'maple-diary-data'

function trimTrailingZeros(value: string): string {
  return value.replace(/\.?0+$/, '')
}

export function formatMesoKorean(amount: number): string {
  if (amount === 0) return '0'
  const sign = amount < 0 ? '-' : ''
  const eok = Math.abs(amount) / 100_000_000

  if (eok >= 10) {
    const v = Math.round(eok * 10) / 10
    return `${sign}${trimTrailingZeros(v.toFixed(1))}억`
  }
  if (eok >= 1) {
    const v = Math.round(eok * 10) / 10
    return `${sign}${trimTrailingZeros(v.toFixed(1))}억`
  }
  if (eok >= 0.01) {
    const v = Math.round(eok * 100) / 100
    return `${sign}${trimTrailingZeros(v.toFixed(2))}억`
  }

  const v = Math.round(eok * 1000) / 1000
  return `${sign}${trimTrailingZeros(v.toFixed(3))}억`
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
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '')
}

export function getWeeklyPeriod(date = new Date()): { start: string; end: string; label: string } {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day + 3) % 7
  const start = new Date(d)
  start.setDate(d.getDate() - diff)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  const fmt = (dt: Date) => dt.toISOString().split('T')[0]
  const startStr = fmt(start)
  const endStr = fmt(end)
  return { start: startStr, end: endStr, label: `${startStr} ~ ${endStr}` }
}

export function getMonthlyPeriod(date = new Date()): { start: string; end: string; label: string } {
  const year = date.getFullYear()
  const month = date.getMonth()
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)

  const fmt = (dt: Date) => {
    const y = dt.getFullYear()
    const m = String(dt.getMonth() + 1).padStart(2, '0')
    const d = String(dt.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const startStr = fmt(start)
  const endStr = fmt(end)
  return { start: startStr, end: endStr, label: `${startStr} ~ ${endStr}` }
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
