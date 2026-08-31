import type { Page } from '../types'

export const PAGE_PATHS: Record<Page, string> = {
  dashboard: '/',
  diary: '/diary',
  hunt: '/hunt',
  alert: '/alert',
  expense: '/ledger',
  boss: '/boss',
  drop: '/drop',
  gather: '/gather',
  goals: '/goals',
  rice: '/rice',
  premium: '/premium',
  yield: '/yield',
}

const PATH_TO_PAGE = Object.fromEntries(
  Object.entries(PAGE_PATHS).map(([page, path]) => [path, page as Page])
) as Record<string, Page>

export function pageToPath(page: Page): string {
  return PAGE_PATHS[page]
}

export function pathToPage(pathname: string): Page | null {
  if (pathname === '/' || pathname === '') return 'dashboard'
  return PATH_TO_PAGE[pathname] ?? null
}

export function syncPageUrl(page: Page, mode: 'push' | 'replace') {
  const path = pageToPath(page)
  if (window.location.pathname === path) return
  const state = { page }
  if (mode === 'replace') window.history.replaceState(state, '', path)
  else window.history.pushState(state, '', path)
}
