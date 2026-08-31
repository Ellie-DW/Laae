import { useEffect, useMemo, useRef, useState } from 'react'
import type { Character } from '../../types'

interface CharacterScopeSelectProps {
  characters: Character[]
  value: string | null
  onChange: (id: string | null) => void
}

export default function CharacterScopeSelect({
  characters,
  value,
  onChange,
}: CharacterScopeSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  const selected = characters.find((character) => character.id === value) ?? null
  const showSearch = characters.length > 8
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return characters
    return characters.filter((character) => character.name.toLowerCase().includes(needle))
  }, [characters, query])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        setQuery('')
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const pick = (id: string | null) => {
    onChange(id)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={rootRef} className="relative w-full max-w-xs">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-dark-border bg-dark-surface/40 text-left hover:border-cyber-500/30 transition-colors"
      >
        <span className="min-w-0">
          <span className="block text-sm font-medium text-slate-100 truncate">
            {selected?.name ?? '전체 캐릭터'}
          </span>
          <span className="block text-[11px] text-slate-500 mt-0.5">
            {selected ? '이 캐릭터만' : `${characters.length}명 함께 보기`}
          </span>
        </span>
        <span className="text-[10px] text-slate-500 shrink-0">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-dark-border bg-dark-surface shadow-lg overflow-hidden">
          {showSearch && (
            <div className="p-2 border-b border-dark-border/60">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="캐릭터 찾기"
                className="input-field text-sm py-1.5"
                autoFocus
              />
            </div>
          )}
          <ul className="max-h-64 overflow-y-auto py-1">
            <li>
              <button
                type="button"
                onClick={() => pick(null)}
                className={`w-full px-3 py-2 text-left text-sm ${
                  value === null ? 'text-cyber-300 bg-cyber-500/10' : 'text-slate-300 hover:bg-dark-panel/70'
                }`}
              >
                전체 캐릭터
              </button>
            </li>
            {filtered.map((character) => (
              <li key={character.id}>
                <button
                  type="button"
                  onClick={() => pick(character.id)}
                  className={`w-full px-3 py-2 text-left text-sm truncate ${
                    value === character.id
                      ? 'text-cyber-300 bg-cyber-500/10'
                      : 'text-slate-300 hover:bg-dark-panel/70'
                  }`}
                >
                  {character.name}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-xs text-slate-500">맞는 캐릭터가 없어요</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
