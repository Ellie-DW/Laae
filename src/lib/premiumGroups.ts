import type { Character } from '../types'
import type { PremiumCharacterGroup } from './premiumGroupsApi'

export interface PremiumCharacterSection {
  group: PremiumCharacterGroup | null
  characters: Character[]
}

export function buildPremiumCharacterSections(
  characters: Character[],
  groups: PremiumCharacterGroup[]
): PremiumCharacterSection[] {
  const groupIds = new Set(groups.map((group) => group.id))
  const byGroupId = new Map<string, Character[]>()
  const ungrouped: Character[] = []

  for (const character of characters) {
    const groupId = character.premiumGroupId
    if (!groupId || !groupIds.has(groupId)) {
      ungrouped.push(character)
      continue
    }
    const list = byGroupId.get(groupId) ?? []
    list.push(character)
    byGroupId.set(groupId, list)
  }

  const sections: PremiumCharacterSection[] = groups.map((group) => ({
    group,
    characters: byGroupId.get(group.id) ?? [],
  }))

  if (ungrouped.length > 0) {
    sections.push({ group: null, characters: ungrouped })
  }

  return sections
}
