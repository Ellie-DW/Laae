const EOK = 100_000_000

export function calcRiceTradeAmount(mesoSold: number, wonPerEok: number): number {
  if (mesoSold <= 0 || wonPerEok <= 0) return 0
  return Math.round((mesoSold / EOK) * wonPerEok)
}

export function formatWonPerEok(wonPerEok: number): string {
  return `1억당 ${Math.round(wonPerEok).toLocaleString('ko-KR')}원`
}

export function buildRiceTradeDescription(_mesoSold: number, wonPerEok: number): string {
  return `메소 거래 · ${formatWonPerEok(wonPerEok)}`
}

export function parseWonPerEokInput(value: string): number {
  const num = parseInt(value.replace(/[^\d]/g, ''), 10)
  return Number.isFinite(num) ? num : 0
}
