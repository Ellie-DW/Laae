export type ThemeMode = 'cyber' | 'dark' | 'light'

export const THEME_STORAGE_KEY = 'maple-diary-theme'

export const THEME_OPTIONS: { id: ThemeMode; label: string; description: string }[] = [
  { id: 'cyber', label: '기본', description: '사이버 그리드 · 네온' },
  { id: 'dark', label: '다크', description: '심플 다크' },
  { id: 'light', label: '화이트', description: '밝은 배경' },
]

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === 'cyber' || value === 'dark' || value === 'light'
}

export function readStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'cyber'
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  return isThemeMode(stored) ? stored : 'cyber'
}

export function applyThemeToDocument(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme
}
