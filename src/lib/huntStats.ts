import type { HuntRecord } from '../types'
import { formatMesoKorean } from '../utils'

export function getHeldSolErdaFragments(hunts: HuntRecord[], characterId?: string) {
  return hunts
    .filter((h) => !characterId || h.characterId === characterId)
    .reduce((s, h) => s + h.solErdaFragments, 0)
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

export function getHuntCumulativeStats(hunts: HuntRecord[], characterId?: string): HuntCumulativeStats {
  const filtered = hunts.filter((h) => !characterId || h.characterId === characterId)

  let huntMesoTotal = 0
  let saleMesoTotal = 0
  let acquiredSolErda = 0
  let soldSolErda = 0
  let huntCount = 0
  let saleCount = 0

  for (const h of filtered) {
    const isSale = h.solErdaFragments < 0
    if (isSale) {
      saleMesoTotal += h.meso
      soldSolErda += Math.abs(h.solErdaFragments)
      saleCount += 1
    } else {
      huntMesoTotal += h.meso
      acquiredSolErda += Math.max(0, h.solErdaFragments)
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
    if (h.solErdaFragments < 0) solErdaSaleIncome += h.meso
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
