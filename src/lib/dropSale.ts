export type DropSaleFeeRate = 5 | 3

export interface DropSaleCalcInput {
  grossMeso: number
  feeRate: DropSaleFeeRate
  partySize: number
  ratios?: number[]
}

export interface DropSaleMemberResult {
  label: string
  ratio: number
  ratioPercent: number
  isLeader: boolean
  netShare: number
  deliveryAmount: number
  actualReceive: number
  footerLabel: string
}

export interface DropSaleCalcResult {
  grossMeso: number
  feeRate: DropSaleFeeRate
  partySize: number
  saleFeeAmount: number
  afterSaleFee: number
  ratioLabel: string
  members: DropSaleMemberResult[]
  myIncome: number
}

export function getDropSaleMemberLabels(partySize: number): string[] {
  if (partySize <= 0) return []
  const labels = ['파티장']
  for (let i = 1; i < partySize; i++) labels.push(`파티원${i}`)
  return labels
}

export function normalizeDropSaleRatios(partySize: number, ratios?: number[]): number[] {
  const next = (ratios ?? []).slice(0, partySize).map((r) => Math.max(0, Math.floor(r) || 0))
  while (next.length < partySize) next.push(1)
  if (next.every((r) => r === 0)) return Array(partySize).fill(1)
  return next.map((r) => (r > 0 ? r : 1))
}

function floor100(amount: number): number {
  return Math.floor(amount / 100) * 100
}

export function calcDropSale(input: DropSaleCalcInput): DropSaleCalcResult | null {
  const { grossMeso, feeRate, partySize } = input
  if (grossMeso <= 0 || partySize < 1 || partySize > 6) return null

  const ratios = normalizeDropSaleRatios(partySize, input.ratios)
  const sumRatios = ratios.reduce((sum, ratio) => sum + ratio, 0)
  if (sumRatios <= 0) return null

  const fee = feeRate / 100
  const saleFeeAmount = Math.round(grossMeso * fee)
  const afterSaleFee = grossMeso - saleFeeAmount
  const labels = getDropSaleMemberLabels(partySize)
  const netShares = ratios.map((ratio) => (afterSaleFee * ratio) / sumRatios)

  const deliveryAmounts = new Array(partySize).fill(0)

  if (partySize === 1) {
    deliveryAmounts[0] = afterSaleFee
  } else {
    for (let i = 1; i < partySize; i++) {
      deliveryAmounts[i] = floor100(netShares[i] / (1 - fee))
    }
    deliveryAmounts[0] = afterSaleFee - deliveryAmounts.slice(1).reduce((sum, amount) => sum + amount, 0)
  }

  if (deliveryAmounts[0] < 0) return null

  const members: DropSaleMemberResult[] = labels.map((label, index) => {
    const isLeader = index === 0
    const deliveryAmount = deliveryAmounts[index]
    const actualReceive = isLeader
      ? deliveryAmount
      : Math.round(deliveryAmount * (1 - fee))

    return {
      label,
      ratio: ratios[index],
      ratioPercent: (ratios[index] / sumRatios) * 100,
      isLeader,
      netShare: Math.round(netShares[index]),
      deliveryAmount,
      actualReceive,
      footerLabel: isLeader ? '실수령 기준 잔여' : '전달 금액 (수수료 포함)',
    }
  })

  return {
    grossMeso,
    feeRate,
    partySize,
    saleFeeAmount,
    afterSaleFee,
    ratioLabel: ratios.join(' : '),
    members,
    myIncome: deliveryAmounts[0],
  }
}

export function buildDropSaleMemo(result: DropSaleCalcResult): string {
  const parts = [`${result.feeRate}%`, `${result.partySize}인`, `비율 ${result.ratioLabel}`]
  if (result.partySize > 1) {
    const memberPreview = result.members
      .filter((m) => !m.isLeader)
      .map((m) => `${m.label} ${formatMesoShort(m.deliveryAmount)}`)
      .join(', ')
    if (memberPreview) parts.push(memberPreview)
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

export function formatDropSaleAmount(amount: number): string {
  return amount.toLocaleString('ko-KR')
}
