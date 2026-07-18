import type { HuntRecord, Expense } from '../types'
import { formatMesoKorean } from '../utils'

export function getHeldSolErdaFragments(hunts: HuntRecord[], characterId?: string) {
  return hunts
    .filter((h) => !characterId || h.characterId === characterId)
    .reduce((s, h) => s + h.solErdaFragments, 0)
}

export function isSolErdaSale(hunt: HuntRecord) {
  return hunt.solErdaFragments < 0 && hunt.meso > 0
}

export function isSolErdaSpend(hunt: HuntRecord) {
  return hunt.solErdaFragments < 0 && hunt.meso === 0
}

export const SOL_ERDA_PURCHASE_MEMO_PREFIX = '솔 에르다 조각'

export function buildSolErdaPurchaseMemo(quantity: number, huntId: string) {
  return `${SOL_ERDA_PURCHASE_MEMO_PREFIX} ${quantity.toLocaleString()}개 구매 · hunt:${huntId}`
}

export function parseSolErdaPurchaseMemo(memo: string | null) {
  if (!memo?.startsWith(SOL_ERDA_PURCHASE_MEMO_PREFIX)) return null
  const quantityMatch = memo.match(/([\d,]+)개 구매/)
  const huntMatch = memo.match(/hunt:([a-f0-9-]+)/i)
  if (!quantityMatch || !huntMatch) return null
  return {
    quantity: parseInt(quantityMatch[1].replace(/,/g, ''), 10),
    huntId: huntMatch[1],
    displayMemo: memo.replace(/\s· hunt:[a-f0-9-]+/i, ''),
  }
}

export function isSolErdaPurchaseExpense(memo: string | null) {
  return parseSolErdaPurchaseMemo(memo) !== null
}

export function collectSolErdaPurchaseHuntIds(expenses: Expense[]) {
  const ids = new Set<string>()
  for (const e of expenses) {
    const parsed = parseSolErdaPurchaseMemo(e.memo)
    if (parsed?.huntId) ids.add(parsed.huntId)
  }
  return ids
}

export interface SolErdaMonthStats {
  acquired: number
  purchased: number
  used: number
  sold: number
  saleMeso: number
  purchaseMeso: number
  held: number
  netChange: number
}

export function summarizeSolErdaMonth(
  hunts: HuntRecord[],
  expenses: Expense[],
  monthPrefix: string,
  characterId?: string
): SolErdaMonthStats {
  const inMonth = (date: string) => date.startsWith(monthPrefix)
  const matchChar = (id: string) => !characterId || id === characterId

  const purchaseHuntIds = collectSolErdaPurchaseHuntIds(expenses)

  let acquired = 0
  let purchased = 0
  let used = 0
  let sold = 0
  let saleMeso = 0
  let purchaseMeso = 0

  for (const h of hunts) {
    if (!matchChar(h.characterId)) continue
    if (isSolErdaSale(h) && inMonth(h.recordDate)) {
      sold += Math.abs(h.solErdaFragments)
      saleMeso += h.meso
    } else if (isSolErdaSpend(h) && inMonth(h.recordDate)) {
      used += Math.abs(h.solErdaFragments)
    } else if (
      inMonth(h.recordDate) &&
      h.solErdaFragments > 0 &&
      !purchaseHuntIds.has(h.id)
    ) {
      acquired += h.solErdaFragments
    }
  }

  for (const e of expenses) {
    if (!matchChar(e.characterId) || !inMonth(e.recordDate)) continue
    const parsed = parseSolErdaPurchaseMemo(e.memo)
    if (parsed) {
      purchased += parsed.quantity
      purchaseMeso += e.amount
    }
  }

  const heldHunts = hunts.filter((h) => matchChar(h.characterId))

  return {
    acquired,
    purchased,
    used,
    sold,
    saleMeso,
    purchaseMeso,
    held: getHeldSolErdaFragments(heldHunts),
    netChange: acquired + purchased - used - sold,
  }
}

export interface HuntCumulativeStats {
  huntMesoTotal: number
  saleMesoTotal: number
  totalMeso: number
  acquiredSolErda: number
  soldSolErda: number
  heldSolErda: number
  huntCount: number
  saleCount: number
}

export function getHuntCumulativeStats(
  hunts: HuntRecord[],
  characterId?: string,
  expenses: Expense[] = []
): HuntCumulativeStats {
  const filtered = hunts.filter((h) => !characterId || h.characterId === characterId)
  const purchaseHuntIds = collectSolErdaPurchaseHuntIds(expenses)

  let huntMesoTotal = 0
  let saleMesoTotal = 0
  let acquiredSolErda = 0
  let soldSolErda = 0
  let huntCount = 0
  let saleCount = 0

  for (const h of filtered) {
    if (isSolErdaSale(h)) {
      saleMesoTotal += h.meso
      soldSolErda += Math.abs(h.solErdaFragments)
      saleCount += 1
    } else if (!isSolErdaSpend(h)) {
      huntMesoTotal += h.meso
      if (h.solErdaFragments > 0 && !purchaseHuntIds.has(h.id)) {
        acquiredSolErda += h.solErdaFragments
      }
      huntCount += 1
    }
  }

  return {
    huntMesoTotal,
    saleMesoTotal,
    totalMeso: huntMesoTotal + saleMesoTotal,
    acquiredSolErda,
    soldSolErda,
    heldSolErda: getHeldSolErdaFragments(filtered),
    huntCount,
    saleCount,
  }
}

export function splitHuntIncome(hunts: HuntRecord[]) {
  let huntMesoIncome = 0
  let solErdaSaleIncome = 0

  for (const h of hunts) {
    if (isSolErdaSale(h)) solErdaSaleIncome += h.meso
    else huntMesoIncome += h.meso
  }

  return { huntMesoIncome, solErdaSaleIncome }
}

export function formatHuntIncomeSub(huntMesoIncome: number, solErdaSaleIncome: number) {
  const parts = [`사냥 ${formatMesoKorean(huntMesoIncome)}`]
  if (solErdaSaleIncome > 0) {
    parts.push(`솔에르다 ${formatMesoKorean(solErdaSaleIncome)}`)
  }
  return parts.join(' · ')
}
