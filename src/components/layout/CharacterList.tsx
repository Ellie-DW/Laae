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
  onMoveCharacter: (id: string, direction: 'up' | 'down') => void
  onReorderCharacters: (orderedIds: string[]) => void
  /** 모바일 모달 등 더 큰 터치 영역 */
  variant?: 'sidebar' | 'mobile'
}

interface SortableCharacterRowProps {
  char: Character
  index: number
  total: number
  isSelected: boolean
  isMobile: boolean
  canReorder: boolean
  onSelectCharacter: (id: string) => void
  onRemoveCharacter: (id: string) => void
  onMoveCharacter: (id: string, direction: 'up' | 'down') => void
}

function SortableCharacterRow({
  char,
  index,
  total,
  isSelected,
  isMobile,
  canReorder,
  onSelectCharacter,
  onRemoveCharacter,
  onMoveCharacter,
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

  const isFirst = index === 0
  const isLast = index === total - 1

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
      {canReorder && (
        <div className={`flex items-center gap-0.5 shrink-0 ${isMobile ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity'}`}>
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            className={`rounded text-slate-500 hover:text-cyber-400 hover:bg-cyber-500/10 cursor-grab active:cursor-grabbing touch-none transition-colors ${
              isMobile ? 'w-8 h-10 text-sm' : 'w-6 h-10 text-xs'
            }`}
            title="드래그하여 순서 변경"
            aria-label={`${char.name} 드래그하여 이동`}
          >
            ⠿
          </button>
          <div className={`flex flex-col ${isMobile ? 'gap-0.5' : 'gap-0'}`}>
            <button
              type="button"
              onClick={() => onMoveCharacter(char.id, 'up')}
              disabled={isFirst}
              className={`rounded text-slate-500 hover:text-cyber-400 hover:bg-cyber-500/10 disabled:opacity-20 disabled:pointer-events-none transition-colors ${
                isMobile ? 'w-8 h-7 text-xs' : 'w-6 h-5 text-[10px]'
              }`}
              title="위로"
              aria-label={`${char.name} 위로 이동`}
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => onMoveCharacter(char.id, 'down')}
              disabled={isLast}
              className={`rounded text-slate-500 hover:text-cyber-400 hover:bg-cyber-500/10 disabled:opacity-20 disabled:pointer-events-none transition-colors ${
                isMobile ? 'w-8 h-7 text-xs' : 'w-6 h-5 text-[10px]'
              }`}
              title="아래로"
              aria-label={`${char.name} 아래로 이동`}
            >
              ▼
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => onSelectCharacter(char.id)}
        className={`flex-1 text-left rounded-lg text-sm transition-all ${
          isMobile ? 'px-3 py-3' : 'px-3 py-2.5'
        } ${
          isSelected
            ? 'nav-active'
            : isMobile
              ? 'text-slate-300 hover:bg-dark-panel/50'
              : 'text-slate-400 hover:bg-dark-panel/50 hover:text-slate-200'
        }`}
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
  onMoveCharacter,
  onReorderCharacters,
  variant = 'sidebar',
}: CharacterListProps) {
  const canReorder = characters.length > 1
  const isMobile = variant === 'mobile'
  const characterIds = characters.map((c) => c.id)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
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
          {characters.map((char, index) => (
            <SortableCharacterRow
              key={char.id}
              char={char}
              index={index}
              total={characters.length}
              isSelected={selectedCharacter?.id === char.id}
              isMobile={isMobile}
              canReorder={canReorder}
              onSelectCharacter={onSelectCharacter}
              onRemoveCharacter={onRemoveCharacter}
              onMoveCharacter={onMoveCharacter}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
