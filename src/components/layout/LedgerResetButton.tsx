import { useState } from 'react'

interface LedgerResetButtonProps {
  onReset: () => Promise<void>
}

export default function LedgerResetButton({ onReset }: LedgerResetButtonProps) {
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    const confirmed = confirm(
      '모든 가계부 기록을 삭제할까요?\n\n' +
        '· 사냥·채집·드랍·지출·수입\n' +
        '· 다이어리·목표·보스 잡음 기록\n' +
        '· 쌀곳간·프리미엄·수익률 가계부\n\n' +
        '캐릭터와 보스 난이도 설정은 유지돼요.\n' +
        '되돌릴 수 없습니다.'
    )
    if (!confirmed) return

    setResetting(true)
    setError(null)
    try {
      await onReset()
    } catch (err) {
      setError(err instanceof Error ? err.message : '기록 초기화에 실패했습니다.')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={resetting}
        className="w-full text-xs text-red-400 hover:text-red-300 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50"
      >
        {resetting ? '초기화 중...' : '가계부 기록 초기화'}
      </button>
      {error && <p className="text-[10px] text-red-400 leading-relaxed">{error}</p>}
    </div>
  )
}
