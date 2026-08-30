import { useEffect, useRef, useState } from 'react'
import type { Character, HuntRecord } from '../types'
import { formatMesoEokInput, type HuntOcrCompareHint } from '../lib/huntOcr'
import { clearHuntOcrDraft } from '../lib/huntOcrDraft'
import { formatMesoKorean, getToday, parseMesoInput } from '../utils'
import { useAuth } from '../contexts/AuthContext'
import NoCharacterPrompt, { CharacterBanner } from '../components/ledger/NoCharacterPrompt'
import HuntHeldSummary from '../components/hunt/HuntHeldSummary'
import HuntScreenshotField from '../components/hunt/HuntScreenshotField'
import SolErdaSaleSection from '../components/hunt/SolErdaSaleSection'
import SolErdaIcon from '../components/hunt/SolErdaIcon'
import MesoIcon from '../components/hunt/MesoIcon'

interface HuntPageProps {
  selectedCharacter: Character | null
  hunts: HuntRecord[]
  onAdd: (data: { characterId: string; meso: number; solErdaFragments: number; recordDate: string }) => Promise<void>
  onSellSolErda: (data: { characterId: string; quantity: number; meso: number; recordDate: string }) => Promise<void>
  onRemove: (id: string) => Promise<void>
}

export default function HuntPage({ selectedCharacter, hunts, onAdd, onSellSolErda, onRemove }: HuntPageProps) {
  const { user } = useAuth()
  const [mesoInput, setMesoInput] = useState('')
  const [solErdaInput, setSolErdaInput] = useState('')
  const [recordDate, setRecordDate] = useState(getToday())
  const [ocrKey, setOcrKey] = useState(0)
  const mesoEditedRef = useRef(false)

  useEffect(() => {
    setMesoInput('')
    setSolErdaInput('')
    setRecordDate(getToday())
    mesoEditedRef.current = false
  }, [selectedCharacter?.id])

  if (!selectedCharacter || !user) return <NoCharacterPrompt />

  const charHunts = hunts.filter((h) => h.characterId === selectedCharacter.id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const meso = parseMesoInput(mesoInput)
    const solErdaFragments = solErdaInput.trim() ? Math.max(0, parseInt(solErdaInput, 10) || 0) : 0
    if (meso <= 0 && solErdaFragments <= 0) return

    await onAdd({
      characterId: selectedCharacter.id,
      meso,
      solErdaFragments,
      recordDate,
    })
    setMesoInput('')
    setSolErdaInput('')
    setRecordDate(getToday())
    mesoEditedRef.current = false
    clearHuntOcrDraft(user.id, selectedCharacter.id)
    setOcrKey((key) => key + 1)
  }

  const handleOcrResult = (hint: HuntOcrCompareHint | null) => {
    if (!hint) {
      setMesoInput('')
      setSolErdaInput('')
      mesoEditedRef.current = false
      return
    }
    if (!mesoEditedRef.current) {
      setMesoInput(hint.mesoUnreliable ? '' : formatMesoEokInput(hint.acquiredMeso))
    }
    if (hint.acquiredFragments > 0) {
      setSolErdaInput(String(hint.acquiredFragments))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">사냥</h1>
        <CharacterBanner character={selectedCharacter} />
      </div>

      <HuntHeldSummary hunts={hunts} characterId={selectedCharacter.id} />

      <form onSubmit={handleSubmit} className="panel-light p-5 space-y-5">
        <div>
          <h2 className="font-semibold text-slate-100">사냥 기록</h2>
          <p className="text-xs text-slate-500 mt-0.5">스샷으로 채우거나, 아래에서 직접 입력해도 됩니다</p>
        </div>
        <HuntScreenshotField
          key={`${selectedCharacter.id}-${ocrKey}`}
          userId={user.id}
          characterId={selectedCharacter.id}
          onResult={handleOcrResult}
        />
        <div className="border-t border-dark-border/60 pt-4 space-y-3">
          <p className="text-xs font-medium text-slate-400">이번에 기록할 획득</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                <MesoIcon size="xs" />
                획득 메소 (억 단위)
              </label>
              <input
                value={mesoInput}
                onChange={(e) => {
                  mesoEditedRef.current = true
                  setMesoInput(e.target.value)
                }}
                placeholder="예: 1, 0.5, 1.5억"
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                <SolErdaIcon size="xs" />
                솔 에르다 조각
              </label>
              <input
                value={solErdaInput}
                onChange={(e) => setSolErdaInput(e.target.value)}
                type="number"
                min={0}
                placeholder="0"
                className="input-field text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">날짜</label>
            <input
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
              type="date"
              required
              className="input-field text-sm"
            />
          </div>
          <button type="submit" className="btn-primary text-sm w-full py-2.5">사냥 기록 추가</button>
        </div>
      </form>

      <SolErdaSaleSection
        hunts={hunts}
        characterId={selectedCharacter.id}
        onSell={async (data) => {
          await onSellSolErda({
            characterId: selectedCharacter.id,
            ...data,
          })
        }}
      />

      <div className="panel-light p-5">
        <h2 className="font-semibold text-slate-100 mb-4">사냥 기록</h2>
        {charHunts.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">아직 사냥 기록이 없어요</p>
        ) : (
          <div className="record-list-scroll">
            {charHunts.map((h) => {
              const isSale = h.solErdaFragments < 0 && h.meso > 0
              const isSpend = h.solErdaFragments < 0 && h.meso === 0
              const hasSolErda = h.solErdaFragments !== 0
              return (
                <div key={h.id} className="flex items-center gap-3 p-3 rounded-lg bg-dark-surface/50 border border-dark-border">
                  {hasSolErda ? (
                    <SolErdaIcon size="sm" />
                  ) : (
                    <MesoIcon size="sm" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200">
                      {h.recordDate}
                      {isSale && <span className="text-violet-400 ml-2">솔 에르다 판매</span>}
                      {isSpend && <span className="text-violet-400 ml-2">솔 에르다 사용</span>}
                    </p>
                    {h.solErdaFragments > 0 && (
                      <p className="text-xs text-slate-500 mt-0.5">솔 에르다 조각 +{h.solErdaFragments.toLocaleString()}개</p>
                    )}
                    {isSale && (
                      <p className="text-xs text-slate-500 mt-0.5">솔 에르다 조각 {h.solErdaFragments.toLocaleString()}개</p>
                    )}
                    {isSpend && (
                      <p className="text-xs text-slate-500 mt-0.5">솔 에르다 조각 {h.solErdaFragments.toLocaleString()}개 사용</p>
                    )}
                  </div>
                  {h.meso > 0 && (
                    <span className={`text-sm font-semibold shrink-0 ${isSale ? 'text-violet-400' : 'text-cyber-400'}`}>
                      +{formatMesoKorean(h.meso)}
                    </span>
                  )}
                  <button onClick={() => onRemove(h.id)} className="text-slate-600 hover:text-red-400 text-xs">✕</button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
