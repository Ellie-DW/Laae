export function normalizeCharacterName(name: string): string {
  return name.trim()
}

export const DUPLICATE_CHARACTER_NAME_MESSAGE = '이미 등록된 캐릭터명입니다.'

export function compareCharacterNames(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

