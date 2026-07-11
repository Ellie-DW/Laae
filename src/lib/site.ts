export const SITE_NAME = 'Laae'
export const SITE_TAGLINE = '메이플 가게부'
export const OPEN_KAKAO_URL = 'https://open.kakao.com/o/sJPHfCDi'
export const LEGAL_EFFECTIVE_DATE = '2026-07-12'

export const LEGAL_PATHS = {
  privacy: '/privacy',
  terms: '/terms',
} as const

export type LegalPath = (typeof LEGAL_PATHS)[keyof typeof LEGAL_PATHS]

export function isLegalPath(pathname: string): pathname is LegalPath {
  return pathname === LEGAL_PATHS.privacy || pathname === LEGAL_PATHS.terms
}
