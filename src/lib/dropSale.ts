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
}

interface SplitCandidate extends SplitPlan {
  diff: number
}

function tryEqualSplitBaseUnit(
  afterSaleFee: number,
  partySize: number,
  feeRate: DropSaleFeeRate,
  baseUnit: number
): SplitPlan | null {
  if (baseUnit <= 0) return null

  const receives = Array(partySize).fill(baseUnit)
  const deliveries: number[] = []

  for (let index = 1; index < partySize; index++) {
    const delivery = deliveryForReceive(baseUnit, feeRate)
    if (actualReceiveFromDelivery(delivery, feeRate) !== baseUnit) {
      return null
    }
    deliveries.push(delivery)
  }

  const totalDelivery = deliveries.reduce((sum, amount) => sum + amount, 0)
  const leaderKeep = afterSaleFee - totalDelivery
  if (leaderKeep <= 0) return null

  return { receives, deliveries, leaderKeep }
}

function tryRatioSplitBaseUnit(
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
    const delivery = deliveryForReceive(receives[index], feeRate)
    if (actualReceiveFromDelivery(delivery, feeRate) !== receives[index]) {
      return null
    }
    deliveries.push(delivery)
  }

  const totalDelivery = deliveries.reduce((sum, amount) => sum + amount, 0)
  const leaderKeep = afterSaleFee - totalDelivery
  if (leaderKeep <= 0) return null

  return { receives, deliveries, leaderKeep }
}

function estimateEqualBaseUnit(afterSaleFee: number, partySize: number, feeRate: DropSaleFeeRate): number {
  if (partySize <= 1) return afterSaleFee
  return Math.floor((afterSaleFee * (100 - feeRate)) / ((partySize - 1) * 100 + (100 - feeRate)))
}

function estimateRatioBaseUnit(afterSaleFee: number, feeRate: DropSaleFeeRate, ratios: number[]): number {
  const memberRatioSum = ratios.slice(1).reduce((sum, ratio) => sum + ratio, 0)
  const denominator = ratios[0] + (100 * memberRatioSum) / (100 - feeRate)
  if (denominator <= 0) return 0
  return Math.floor(afterSaleFee / denominator)
}

function pickBestSplitCandidate(candidates: SplitCandidate[]): SplitPlan | null {
  if (candidates.length === 0) return null

  return candidates.reduce((best, plan) => {
    if (plan.diff < best.diff) return plan
    if (plan.diff > best.diff) return best
    if (plan.leaderKeep >= plan.receives[0] && best.leaderKeep < best.receives[0]) return plan
    if (plan.leaderKeep < plan.receives[0] && best.leaderKeep >= best.receives[0]) return best
    if (plan.receives[0] > best.receives[0]) return plan
    return best
  })
}

function collectSplitCandidates(
  afterSaleFee: number,
  tryBaseUnit: (baseUnit: number) => SplitPlan | null,
  estimate: number,
  searchRadius: number
): SplitCandidate[] {
  const candidates: SplitCandidate[] = []

  const addCandidate = (plan: SplitPlan | null) => {
    if (!plan) return
    candidates.push({ ...plan, diff: Math.abs(plan.leaderKeep - plan.receives[0]) })
  }

  for (
    let baseUnit = estimate + searchRadius;
    baseUnit >= Math.max(1, estimate - searchRadius);
    baseUnit--
  ) {
    addCandidate(tryBaseUnit(baseUnit))
  }

  let lo = 1
  let hi = afterSaleFee
  let maxValidBase = 0

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    const plan = tryBaseUnit(mid)
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
      addCandidate(tryBaseUnit(baseUnit))
    }
  }

  return candidates
}

function findBestSplitPlan(
  afterSaleFee: number,
  tryBaseUnit: (baseUnit: number) => SplitPlan | null,
  estimate: number,
  searchRadius: number
): SplitPlan | null {
  const candidates = collectSplitCandidates(afterSaleFee, tryBaseUnit, estimate, searchRadius)
  const exactMatch = candidates.find((plan) => plan.diff === 0)
  if (exactMatch) return exactMatch
  return pickBestSplitCandidate(candidates)
}

/** 균등 분배: 모든 파티원이 같은 실수령을 받도록 계산 */
function findEqualSplitPlan(
  afterSaleFee: number,
  partySize: number,
  feeRate: DropSaleFeeRate
): SplitPlan | null {
  const estimate = estimateEqualBaseUnit(afterSaleFee, partySize, feeRate)
  return findBestSplitPlan(
    afterSaleFee,
    (baseUnit) => tryEqualSplitBaseUnit(afterSaleFee, partySize, feeRate, baseUnit),
    estimate,
    5000
  )
}

/** 비율 분배: 실수령이 입력 비율(예: 2:1:1)이 되도록 baseUnit을 찾아 계산 */
function findRatioSplitPlan(
  afterSaleFee: number,
  partySize: number,
  feeRate: DropSaleFeeRate,
  ratios: number[]
): SplitPlan | null {
  const estimate = estimateRatioBaseUnit(afterSaleFee, feeRate, ratios)
  return findBestSplitPlan(
    afterSaleFee,
    (baseUnit) => tryRatioSplitBaseUnit(afterSaleFee, partySize, feeRate, ratios, baseUnit),
    estimate,
    20000
  )
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
    }
  }

  const isEqualSplit = ratios.every((ratio) => ratio === ratios[0])
  if (isEqualSplit) {
    return findEqualSplitPlan(afterSaleFee, partySize, feeRate)
  }

  return findRatioSplitPlan(afterSaleFee, partySize, feeRate, ratios)
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
