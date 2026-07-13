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

function floorMeso(amount: number): number {
  if (amount <= 0) return 0
  return Math.floor(amount)
}

function actualReceiveFromDelivery(delivery: number, feeRate: DropSaleFeeRate): number {
  return Math.floor((delivery * (100 - feeRate)) / 100)
}

/** 파티원이 targetReceive를 실수령하도록 전달할 최소 금액 */
export function deliveryForReceive(targetReceive: number, feeRate: DropSaleFeeRate): number {
  if (targetReceive <= 0) return 0

  let delivery = Math.ceil((targetReceive * 100) / (100 - feeRate))
  for (let i = 0; i < 1000; i++) {
    if (actualReceiveFromDelivery(delivery, feeRate) === targetReceive) {
      return delivery
    }
    delivery += 1
  }

  return Math.ceil((targetReceive * 100) / (100 - feeRate))
}

interface SplitPlan {
  receives: number[]
  deliveries: number[]
  leaderKeep: number
  diff: number
}

function trySplitBaseUnit(
  afterSaleFee: number,
  partySize: number,
  feeRate: DropSaleFeeRate,
  ratios: number[],
  baseUnit: number
): SplitPlan | null {
  if (baseUnit <= 0) return null

  const receives = ratios.map((ratio) => Math.floor(baseUnit * ratio))
  const deliveries: number[] = []

  for (let index = 1; index < partySize; index++) {
    const targetReceive = receives[index]
    const delivery = deliveryForReceive(targetReceive, feeRate)
    if (actualReceiveFromDelivery(delivery, feeRate) !== targetReceive) {
      return null
    }
    deliveries.push(delivery)
  }

  const totalDelivery = deliveries.reduce((sum, amount) => sum + amount, 0)
  const leaderKeep = afterSaleFee - totalDelivery
  if (leaderKeep <= 0) return null

  return {
    receives,
    deliveries,
    leaderKeep,
    diff: Math.abs(leaderKeep - receives[0]),
  }
}

function estimateEqualBaseUnit(afterSaleFee: number, partySize: number, feeRate: DropSaleFeeRate): number {
  if (partySize <= 1) return afterSaleFee
  return Math.floor((afterSaleFee * (100 - feeRate)) / ((partySize - 1) * 100 + (100 - feeRate)))
}

function estimateRatioBaseUnit(
  afterSaleFee: number,
  feeRate: DropSaleFeeRate,
  ratios: number[]
): number {
  const sumRatios = ratios.reduce((sum, ratio) => sum + ratio, 0)
  if (sumRatios <= 0) return 0

  const memberRatioSum = ratios.slice(1).reduce((sum, ratio) => sum + ratio, 0)
  const deliveryFactor = memberRatioSum / (100 - feeRate)
  const denominator = sumRatios + deliveryFactor
  if (denominator <= 0) return 0

  return Math.floor(afterSaleFee / denominator)
}

function pickBestPlan(plans: SplitPlan[]): SplitPlan | null {
  if (plans.length === 0) return null

  return plans.reduce((best, plan) => {
    if (plan.diff < best.diff) return plan
    if (plan.diff > best.diff) return best
    if (plan.leaderKeep >= plan.receives[0] && best.leaderKeep < best.receives[0]) return plan
    if (plan.leaderKeep < plan.receives[0] && best.leaderKeep >= best.receives[0]) return best
    if (plan.receives[0] > best.receives[0]) return plan
    return best
  })
}

function findSplitPlan(
  afterSaleFee: number,
  partySize: number,
  feeRate: DropSaleFeeRate,
  ratios: number[]
): SplitPlan | null {
  if (partySize === 1) {
    return {
      receives: [afterSaleFee],
      deliveries: [],
      leaderKeep: afterSaleFee,
      diff: 0,
    }
  }

  const sumRatios = ratios.reduce((sum, ratio) => sum + ratio, 0)
  const isEqualSplit = ratios.every((ratio) => ratio === ratios[0])
  const estimate = isEqualSplit
    ? estimateEqualBaseUnit(afterSaleFee, partySize, feeRate)
    : estimateRatioBaseUnit(afterSaleFee, feeRate, ratios)

  const maxBase = Math.floor(afterSaleFee / sumRatios)
  const searchRadius = isEqualSplit ? 5000 : 20000
  const candidates: SplitPlan[] = []

  for (let baseUnit = Math.min(maxBase, estimate + searchRadius); baseUnit >= Math.max(1, estimate - searchRadius); baseUnit--) {
    const plan = trySplitBaseUnit(afterSaleFee, partySize, feeRate, ratios, baseUnit)
    if (plan) candidates.push(plan)
  }

  let best = pickBestPlan(candidates)
  if (best?.diff === 0) return best

  let lo = 1
  let hi = maxBase
  let maxValidBase = 0

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    const plan = trySplitBaseUnit(afterSaleFee, partySize, feeRate, ratios, mid)
    if (plan) {
      maxValidBase = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }

  if (maxValidBase > 0) {
    for (
      let baseUnit = maxValidBase;
      baseUnit >= Math.max(1, maxValidBase - searchRadius);
      baseUnit--
    ) {
      const plan = trySplitBaseUnit(afterSaleFee, partySize, feeRate, ratios, baseUnit)
      if (plan) candidates.push(plan)
    }
    best = pickBestPlan(candidates)
  }

  return best
}

export function calcDropSale(input: DropSaleCalcInput): DropSaleCalcResult | null {
  const { grossMeso, feeRate, partySize } = input
  if (grossMeso <= 0 || partySize < 1 || partySize > 6) return null

  const ratios = normalizeDropSaleRatios(partySize, input.ratios)
  const sumRatios = ratios.reduce((sum, ratio) => sum + ratio, 0)
  if (sumRatios <= 0) return null

  const afterSaleFee = floorMeso((grossMeso * (100 - feeRate)) / 100)
  const saleFeeAmount = grossMeso - afterSaleFee
  const labels = getDropSaleMemberLabels(partySize)
  const plan = findSplitPlan(afterSaleFee, partySize, feeRate, ratios)
  if (!plan) return null

  const members: DropSaleMemberResult[] = labels.map((label, index) => {
    const isLeader = index === 0
    const actualReceive = isLeader ? plan.leaderKeep : plan.receives[index]
    const deliveryAmount = isLeader ? plan.leaderKeep : plan.deliveries[index - 1]

    return {
      label,
      ratio: ratios[index],
      ratioPercent: (ratios[index] / sumRatios) * 100,
      isLeader,
      netShare: actualReceive,
      deliveryAmount,
      actualReceive,
      footerLabel: isLeader ? '실수령' : '실수령',
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
    myIncome: plan.leaderKeep,
  }
}

export function buildDropSaleMemo(result: DropSaleCalcResult): string {
  const parts = [`${result.feeRate}%`, `${result.partySize}인`, `비율 ${result.ratioLabel}`]
  if (result.partySize > 1) {
    const receivePreview = result.members.find((member) => !member.isLeader)?.actualReceive
    if (receivePreview) parts.push(`1인 실수령 ${receivePreview.toLocaleString('ko-KR')}메소`)
  }
  return parts.join(' · ')
}
