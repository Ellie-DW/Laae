export type DropSaleFeeRate = 5 | 3

/** 0.1억 (1,000만 메소) 단위 내림 */
export const EOK_TENTH = 10_000_000

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

/** 0.1억 단위 내림 (소수점 버림) */
export function floorTenthEok(amount: number): number {
  if (amount <= 0) return 0
  return Math.floor(amount / EOK_TENTH) * EOK_TENTH
}

function deliveryForReceive(targetReceive: number, fee: number): number {
  if (targetReceive <= 0) return 0

  let start = floorTenthEok(targetReceive / (1 - fee))
  if (start < EOK_TENTH) start = EOK_TENTH

  for (let delivery = start; delivery <= targetReceive * 2; delivery += EOK_TENTH) {
    if (floorTenthEok(delivery * (1 - fee)) === targetReceive) {
      return delivery
    }
  }

  return start
}

function findSplitBaseUnit(
  afterSaleFee: number,
  partySize: number,
  fee: number,
  ratios: number[]
): number | null {
  if (partySize === 1) return afterSaleFee

  const maxBase = floorTenthEok(afterSaleFee / ratios.reduce((sum, ratio) => sum + ratio, 0))
  for (let baseUnit = maxBase; baseUnit >= EOK_TENTH; baseUnit -= EOK_TENTH) {
    const targetReceives = ratios.map((ratio) => floorTenthEok(baseUnit * ratio))
    const memberDeliveries = ratios.map((_, index) => {
      if (index === 0) return 0
      return deliveryForReceive(targetReceives[index], fee)
    })

    const memberReceives = ratios.map((_, index) => {
      if (index === 0) return targetReceives[index]
      return floorTenthEok(memberDeliveries[index] * (1 - fee))
    })

    if (!memberReceives.every((amount, index) => amount === targetReceives[index])) continue

    const leaderKeep = afterSaleFee - memberDeliveries.slice(1).reduce((sum, amount) => sum + amount, 0)
    if (leaderKeep === memberReceives[0] && leaderKeep > 0) {
      return baseUnit
    }
  }

  return null
}

export function calcDropSale(input: DropSaleCalcInput): DropSaleCalcResult | null {
  const { grossMeso, feeRate, partySize } = input
  if (grossMeso <= 0 || partySize < 1 || partySize > 6) return null

  const ratios = normalizeDropSaleRatios(partySize, input.ratios)
  const sumRatios = ratios.reduce((sum, ratio) => sum + ratio, 0)
  if (sumRatios <= 0) return null

  const fee = feeRate / 100
  const afterSaleFee = floorTenthEok(grossMeso * (1 - fee))
  const saleFeeAmount = grossMeso - afterSaleFee
  const labels = getDropSaleMemberLabels(partySize)

  if (partySize === 1) {
    const member: DropSaleMemberResult = {
      label: labels[0],
      ratio: ratios[0],
      ratioPercent: 100,
      isLeader: true,
      netShare: afterSaleFee,
      deliveryAmount: afterSaleFee,
      actualReceive: afterSaleFee,
      footerLabel: '실수령',
    }

    return {
      grossMeso,
      feeRate,
      partySize,
      saleFeeAmount,
      afterSaleFee,
      ratioLabel: ratios.join(' : '),
      members: [member],
      myIncome: afterSaleFee,
    }
  }

  const baseUnit = findSplitBaseUnit(afterSaleFee, partySize, fee, ratios)
  if (baseUnit == null) return null

  const actualReceives = ratios.map((ratio) => floorTenthEok(baseUnit * ratio))
  const memberDeliveries = ratios.map((_, index) => {
    if (index === 0) return 0
    return deliveryForReceive(actualReceives[index], fee)
  })
  const leaderKeep = afterSaleFee - memberDeliveries.slice(1).reduce((sum, amount) => sum + amount, 0)

  const members: DropSaleMemberResult[] = labels.map((label, index) => {
    const isLeader = index === 0
    const actualReceive = actualReceives[index]
    const deliveryAmount = isLeader ? leaderKeep : memberDeliveries[index]

    return {
      label,
      ratio: ratios[index],
      ratioPercent: (ratios[index] / sumRatios) * 100,
      isLeader,
      netShare: actualReceive,
      deliveryAmount,
      actualReceive,
      footerLabel: '실수령',
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
    myIncome: leaderKeep,
  }
}

export function buildDropSaleMemo(result: DropSaleCalcResult): string {
  const parts = [`${result.feeRate}%`, `${result.partySize}인`, `비율 ${result.ratioLabel}`]
  if (result.partySize > 1) {
    const receivePreview = result.members[0]?.actualReceive
    if (receivePreview) parts.push(`1인 실수령 ${formatMesoShort(receivePreview)}`)
  }
  return parts.join(' · ')
}

function formatMesoShort(amount: number): string {
  if (amount >= 100_000_000) {
    const eok = amount / 100_000_000
    const floored = Math.floor(eok * 10) / 10
    return Number.isInteger(floored) ? `${floored}억` : `${floored.toFixed(1)}억`
  }
  return `${amount.toLocaleString('ko-KR')}메소`
}

export function formatDropSaleAmount(amount: number): string {
  if (amount >= EOK_TENTH) {
    const eok = amount / 100_000_000
    const floored = Math.floor(eok * 10) / 10
    if (floored >= 1) {
      return Number.isInteger(floored)
        ? `${floored.toLocaleString('ko-KR')}억`
        : `${floored.toFixed(1)}억`
    }
  }
  return `${amount.toLocaleString('ko-KR')}메소`
}

export function formatDropSaleAmountDetail(amount: number): string {
  return `${formatDropSaleAmount(amount)} (${amount.toLocaleString('ko-KR')}메소)`
}
