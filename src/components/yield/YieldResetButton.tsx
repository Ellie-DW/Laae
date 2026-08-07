import { useState } from 'react'

interface YieldResetButtonProps {
  onReset: () => Promise<void>
  disabled?: boolean
}

export default function YieldResetButton({ onReset, disabled = false }: YieldResetButtonProps) {
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    const confirmed = confirm(
      '수익률 가계부를 초기화할까요?\n\n' +
        '· 일별 기록 전체\n' +
        '· 시작 원금·투자 시작일\n\n' +
        '메이플 가계부 기록은 유지돼요. (사이드바에서 따로 초기화)\n' +
        '되돌릴 수 없습니다.'
    )
    if (!confirmed) return

    setResetting(true)
    setError(null)
    try {
      await onReset()
    } catch (err) {
      setError(err instanceof Error ? err.message : '초기화에 실패했습니다.')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="yield-reset">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || resetting}
        className="yield-reset-btn"
      >
        {resetting ? '초기화 중...' : '수익률 가계부 초기화'}
      </button>
      {error && <p className="yield-reset-error">{error}</p>}
    </div>
  )
}
