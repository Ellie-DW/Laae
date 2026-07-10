import type { Character } from '../../types'

export default function NoCharacterPrompt() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="text-5xl mb-4">🍁</span>
      <h2 className="text-lg font-semibold text-slate-300">캐릭터를 먼저 추가해주세요</h2>
      <p className="text-sm text-slate-500 mt-2">사이드바에서 캐릭터를 등록할 수 있어요</p>
    </div>
  )
}

export function CharacterBanner({ character }: { character: Character }) {
  return (
    <p className="text-sm text-slate-400">
      기록 대상 · <span className="text-cyber-400">{character.name}</span>
    </p>
  )
}
