import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Character } from '../../types'

interface CharacterListProps {
  characters: Character[]
  selectedCharacter: Character | null
  onSelectCharacter: (id: string) => void
  onRemoveCharacter: (id: string) => void
  onReorderCharacters: (orderedIds: string[]) => void
  /** 모바일 모달 등 더 큰 터치 영역 */
  variant?: 'sidebar' | 'mobile'
}

interface SortableCharacterRowProps {
  char: Character
  isSelected: boolean
  isMobile: boolean
  canReorder: boolean
  onSelectCharacter: (id: string) => void
  onRemoveCharacter: (id: string) => void
}

function SortableCharacterRow({
  char,
  isSelected,
  isMobile,
  canReorder,
  onSelectCharacter,
  onRemoveCharacter,
}: SortableCharacterRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: char.id, disabled: !canReorder })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleRemove = () => {
    if (!confirm(`"${char.name}" 캐릭터를 삭제할까요?\n보스·드랍 데이터도 함께 삭제됩니다.`)) return
    onRemoveCharacter(char.id)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1 group ${isDragging ? 'z-10 opacity-80' : ''}`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...(canReorder ? { ...attributes, ...listeners } : {})}
        onClick={() => onSelectCharacter(char.id)}
        className={`flex-1 text-left rounded-lg text-sm transition-all ${
          isMobile ? 'px-3 py-3' : 'px-3 py-2.5'
        } ${
          isSelected
            ? 'nav-active'
            : isMobile
              ? 'text-slate-300 hover:bg-dark-panel/50'
              : 'text-slate-400 hover:bg-dark-panel/50 hover:text-slate-200'
        } ${canReorder ? 'cursor-grab active:cursor-grabbing touch-none' : ''}`}
        title={canReorder ? '클릭하여 선택 · 드래그하여 순서 변경' : undefined}
      >
        <span className="font-medium">{char.name}</span>
        {isMobile && isSelected && (
          <span className="ml-2 text-[10px] text-cyber-400">선택됨</span>
        )}
      </button>

      <button
        type="button"
        onClick={handleRemove}
        className={`shrink-0 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs ${
          isMobile
            ? 'w-9 h-9 text-slate-500'
            : 'w-7 h-7 opacity-0 group-hover:opacity-100'
        }`}
        title="캐릭터 삭제"
      >
        ✕
      </button>
    </div>
  )
}

export default function CharacterList({
  characters,
  selectedCharacter,
  onSelectCharacter,
  onRemoveCharacter,
  onReorderCharacters,
  variant = 'sidebar',
}: CharacterListProps) {
  const canReorder = characters.length > 1
  const isMobile = variant === 'mobile'
  const characterIds = characters.map((c) => c.id)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = characterIds.indexOf(String(active.id))
    const newIndex = characterIds.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return

    onReorderCharacters(arrayMove(characterIds, oldIndex, newIndex))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={characterIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">
          {canReorder && (
            <p className="text-[10px] text-slate-500 px-1 mb-1">
              {isMobile ? '이름을 길게 눌러 드래그하면 순서 변경' : '이름을 드래그하면 순서 변경'}
            </p>
          )}
          {characters.map((char) => (
            <SortableCharacterRow
              key={char.id}
              char={char}
              isSelected={selectedCharacter?.id === char.id}
              isMobile={isMobile}
              canReorder={canReorder}
              onSelectCharacter={onSelectCharacter}
              onRemoveCharacter={onRemoveCharacter}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
