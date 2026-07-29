import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import type { Character } from '../types'
import type { PremiumAccessGrant } from '../lib/premiumAccessApi'
import type { PremiumCharacterGroup } from '../lib/premiumGroupsApi'
import type { LedgerSummary } from '../lib/ledgerAnalytics'
import { buildPremiumCharacterSections } from '../lib/premiumGroups'
import PremiumAccessAdmin from '../components/premium/PremiumAccessAdmin'
import PremiumCharacterCard from '../components/premium/PremiumCharacterCard'
import PremiumDraggableCharacterCard, {
  parsePremiumCharacterDragId,
} from '../components/premium/PremiumDraggableCharacterCard'
import PremiumGroupDropSection, {
  parsePremiumGroupDropId,
} from '../components/premium/PremiumGroupDropSection'
import PremiumGroupManager from '../components/premium/PremiumGroupManager'
import PremiumIcon from '../components/premium/PremiumIcon'

interface PremiumPageProps {
  characters: Character[]
  groups: PremiumCharacterGroup[]
  groupsLoading: boolean
  getCharacterSummary: (characterId: string) => LedgerSummary
  onSelectCharacter: (id: string) => void
  onCreateGroup: (name: string) => Promise<void>
  onRenameGroup: (groupId: string, name: string) => Promise<void>
  onDeleteGroup: (groupId: string) => Promise<void>
  onAssignCharacterGroup: (characterId: string, groupId: string | null) => Promise<void>
  isOwner: boolean
  grants: PremiumAccessGrant[]
  onGrantAccess: (email: string) => Promise<void>
  onRevokeAccess: (userId: string) => Promise<void>
}

export default function PremiumPage({
  characters,
  groups,
  groupsLoading,
  getCharacterSummary,
  onSelectCharacter,
  onCreateGroup,
  onRenameGroup,
  onDeleteGroup,
  onAssignCharacterGroup,
  isOwner,
  grants,
  onGrantAccess,
  onRevokeAccess,
}: PremiumPageProps) {
  const [draggingCharacterId, setDraggingCharacterId] = useState<string | null>(null)

  const sections = useMemo(
    () => buildPremiumCharacterSections(characters, groups),
    [characters, groups]
  )

  const dragEnabled = groups.length > 0

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  const draggingCharacter = useMemo(
    () => characters.find((character) => character.id === draggingCharacterId) ?? null,
    [characters, draggingCharacterId]
  )

  const handleDragStart = (event: DragStartEvent) => {
    setDraggingCharacterId(parsePremiumCharacterDragId(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingCharacterId(null)

    const characterId = parsePremiumCharacterDragId(event.active.id)
    if (!characterId || !event.over) return

    const targetGroupId = parsePremiumGroupDropId(event.over.id)
    if (targetGroupId === undefined) return

    const character = characters.find((item) => item.id === characterId)
    if (!character || character.premiumGroupId === targetGroupId) return

    void onAssignCharacterGroup(characterId, targetGroupId)
  }

  const handleDragCancel = () => {
    setDraggingCharacterId(null)
  }

  const renderSectionContent = (section: (typeof sections)[number]) => {
    if (section.characters.length === 0) {
      return (
        <div className="panel-light p-8 text-center min-h-[140px] flex flex-col items-center justify-center">
          <p className="text-sm text-slate-500">이 그룹에 캐릭터가 없어요</p>
          <p className="text-xs text-slate-600 mt-1">
            {dragEnabled ? '캐릭터 카드를 여기로 드래그해 보세요' : '카드 하단에서 캐릭터를 배정해 보세요'}
          </p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
        {section.characters.map((character) => (
          <PremiumDraggableCharacterCard
            key={character.id}
            character={character}
            summary={getCharacterSummary(character.id)}
            groups={groups}
            dragEnabled={dragEnabled}
            onGroupChange={(groupId) => onAssignCharacterGroup(character.id, groupId)}
            onClick={() => onSelectCharacter(character.id)}
          />
        ))}
      </div>
    )
  }

  const sectionList = (
    <div className="space-y-8">
      {sections.map((section) => (
        <PremiumGroupDropSection
          key={section.group?.id ?? 'ungrouped'}
          group={section.group}
          characterCount={section.characters.length}
          dropEnabled={dragEnabled}
        >
          {renderSectionContent(section)}
        </PremiumGroupDropSection>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <PremiumIcon size="lg" />
          프리미엄
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          아이디별 그룹으로 캐릭터를 모아보고, 드래그해서 옮길 수 있어요
        </p>
      </div>

      <PremiumGroupManager
        groups={groups}
        onCreate={onCreateGroup}
        onRename={onRenameGroup}
        onDelete={onDeleteGroup}
      />

      {characters.length === 0 ? (
        <div className="panel-light p-10 text-center">
          <p className="text-sm text-slate-400">등록된 캐릭터가 없어요</p>
          <p className="text-xs text-slate-600 mt-2">사이드바에서 캐릭터를 추가해 보세요</p>
        </div>
      ) : groupsLoading ? (
        <div className="panel-light p-10 text-center">
          <p className="text-sm text-slate-400">그룹 불러오는 중...</p>
        </div>
      ) : dragEnabled ? (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          {sectionList}
          <DragOverlay dropAnimation={null}>
            {draggingCharacter ? (
              <div className="w-[160px] rotate-2 scale-105 opacity-95 pointer-events-none">
                <PremiumCharacterCard
                  character={draggingCharacter}
                  summary={getCharacterSummary(draggingCharacter.id)}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        sectionList
      )}

      {isOwner && (
        <PremiumAccessAdmin
          grants={grants}
          onGrant={onGrantAccess}
          onRevoke={onRevokeAccess}
        />
      )}
    </div>
  )
}
