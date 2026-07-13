export type DropSaleFeeRate = 5 | 3

export interface DropSaleCalcInput {
  grossMeso: number
  feeRate: DropSaleFeeRate
  partySize: number
}

export interface DropSaleCalcResult {
  grossMeso: number
  feeRate: DropSaleFeeRate
  partySize: number
  saleFeeAmount: number
  afterSaleFee: number
  sharePerPerson: number
  myIncome: number
  partyMemberReceive: number
  partyMemberCount: number
}

export function calcDropSale(input: DropSaleCalcInput): DropSaleCalcResult | null {
  const { grossMeso, feeRate, partySize } = input
  if (grossMeso <= 0 || partySize < 1 || partySize > 6) return null

  const fee = feeRate / 100
  const saleFeeAmount = Math.round(grossMeso * fee)
  const afterSaleFee = grossMeso - saleFeeAmount
  const sharePerPerson = Math.round(afterSaleFee / partySize)
  const partyMemberReceive = partySize > 1 ? Math.round(sharePerPerson * (1 - fee)) : afterSaleFee

  return {
    grossMeso,
    feeRate,
    partySize,
    saleFeeAmount,
    afterSaleFee,
    sharePerPerson,
    myIncome: sharePerPerson,
    partyMemberReceive,
    partyMemberCount: Math.max(partySize - 1, 0),
  }
}

export function buildDropSaleMemo(result: DropSaleCalcResult): string {
  const parts = [`${result.feeRate}%`, `${result.partySize}인`]
  if (result.partySize > 1) {
    parts.push(`파티원 실수령 ${formatMesoShort(result.partyMemberReceive)}`)
  }
  return parts.join(' · ')
}

function formatMesoShort(amount: number): string {
  if (amount >= 100_000_000) {
    const eok = amount / 100_000_000
    return Number.isInteger(eok) ? `${eok}억` : `${eok.toFixed(1)}억`
  }
  return `${amount.toLocaleString('ko-KR')}메소`
}
