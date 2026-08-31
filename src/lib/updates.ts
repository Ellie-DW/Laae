export interface SiteUpdate {
  id: string
  date: string
  title: string
  items: string[]
}

const SEEN_KEY = 'laae-whats-new-seen'

export function formatUpdateDate(date: string): string {
  const [, month, day] = date.split('-')
  if (!month || !day) return date
  return `${Number(month)}.${Number(day)}`
}

export function getSeenUpdateId(): string | null {
  try {
    return localStorage.getItem(SEEN_KEY)
  } catch {
    return null
  }
}

export function markUpdateSeen(id: string) {
  try {
    localStorage.setItem(SEEN_KEY, id)
  } catch {
    // ignore quota / private mode
  }
}

export function hasUnseenUpdate(latestId?: string | null): boolean {
  if (!latestId) return false
  return getSeenUpdateId() !== latestId
}
