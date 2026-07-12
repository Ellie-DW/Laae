import type { Page } from '../types'

import navDashboard from '../assets/images/nav/dashboard.png'
import navDiary from '../assets/images/nav/diary.png'
import navHunt from '../assets/images/nav/hunt.png'
import navExpense from '../assets/images/nav/expense.png'
import navBoss from '../assets/images/nav/boss.png'
import navDrop from '../assets/images/nav/drop.png'
import navGather from '../assets/images/nav/gather.png'
import navGoals from '../assets/images/nav/goals.png'
import navLogo from '../assets/images/nav/logo.png'
import huntMeso from '../assets/images/hunt/meso.png'
import huntSolErda from '../assets/images/hunt/sol-erda.png'

export const SITE_LOGO_SRC = navLogo
export const HUNT_MESO_ICON_SRC = huntMeso
export const HUNT_SOL_ERDA_ICON_SRC = huntSolErda

export const NAV_ICON_SRC: Record<Page, string> = {
  dashboard: navDashboard,
  diary: navDiary,
  hunt: navHunt,
  expense: navExpense,
  boss: navBoss,
  drop: navDrop,
  gather: navGather,
  goals: navGoals,
  rice: navGoals,
}

import { normalizeDropItemName } from '../data/dropItems'

const bossModules = import.meta.glob<string>('../assets/images/bosses/*.png', {
  eager: true,
  import: 'default',
})

const BOSS_ICON_FILE_BY_ID: Record<string, string> = {
  seren: '선택받은 세렌',
  kalos: '감시자 칼로스',
  'first-adversary': '최초의 대적자',
  karing: '카링',
  'brilliant-void': '찬란한 흉성',
  limbo: '림보',
  baldrix: '발드릭스',
  jupiter: '유피테르',
  suu: '스우',
  damien: '데미안',
  'g-slime': '가디언 엔젤 슬라임',
  gloom: '더스크',
  will: '윌',
  lucid: '루시드',
  darknell: '듄켈',
  'true-hilla': '진 힐라',
  'black-mage': '검은 마법사',
  zakum: '자쿰',
  magnus: '매그너스',
  papulatus: '파풀라투스',
  pierre: '피에르',
  'von-bon': '반반',
  'bloody-queen': '블러디퀸',
  vellum: '벨룸',
}

const dropModules = import.meta.glob<string>('../assets/images/drops/*.png', {
  eager: true,
  import: 'default',
})

const DROP_ICON_ALIASES: Record<string, string> = {
  '리스트레인트 링 Lv4': '리스트레인트링',
  '컨티뉴어스 링 Lv4': '컨티뉴어스 링',
}

function assetPath(folder: string, fileName: string) {
  return `../assets/images/${folder}/${fileName}.png`
}

export function getBossIconSrc(bossId: string): string | undefined {
  const file = BOSS_ICON_FILE_BY_ID[bossId]
  if (!file) return undefined
  return bossModules[assetPath('bosses', file)]
}

export function getDropIconSrc(itemName: string): string | undefined {
  const normalized = normalizeDropItemName(itemName)
  const file = DROP_ICON_ALIASES[normalized] ?? normalized
  return dropModules[assetPath('drops', file)]
}
