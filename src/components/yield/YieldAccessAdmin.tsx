import { useState } from 'react'
import type { YieldAccessGrant } from '../../lib/yieldAccessApi'
import { YieldPanel } from './YieldUi'

interface YieldAccessAdminProps {
  grants: YieldAccessGrant[]
  onGrant: (email: string) => Promise<void>
  onRevoke: (userId: string) => Promise<void>
}

export default function YieldAccessAdmin({ grants, onGrant, onRevoke }: YieldAccessAdminProps) {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGrant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return

    setSubmitting(true)
    setError(null)
    try {
      await onGrant(trimmed)
      setEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '권한 부여에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRevoke = async (userId: string) => {
    if (!confirm('이 사용자의 수익률 가계부 권한을 해제할까요?')) return
    setError(null)
    try {
      await onRevoke(userId)
    } catch (err) {
      setError(err instanceof Error ? err.message : '권한 해제에 실패했습니다.')
    }
  }

  return (
    <YieldPanel
      title="권한 관리"
      description="권한을 받은 사용자만 수익률 가계부 탭이 표시됩니다"
      accent="neutral"
    >
      <div className="space-y-4">
        <form onSubmit={handleGrant} className="flex gap-2">
          <input
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (error) setError(null)
            }}
            placeholder="Google 이메일"
            className="input-field text-sm flex-1"
          />
          <button
            type="submit"
            disabled={submitting || !email.trim()}
            className="btn-primary text-sm px-5 py-2 disabled:opacity-50 shrink-0"
          >
            {submitting ? '...' : '권한 부여'}
          </button>
        </form>

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {grants.length === 0 ? (
          <p className="yield-grant-empty">권한을 받은 사용자가 없어요</p>
        ) : (
          <div className="record-list-scroll space-y-2">
            {grants.map((grant) => (
              <div key={grant.userId} className="yield-grant-row">
                <div className="yield-grant-avatar">
                  {(grant.fullName ?? grant.email ?? '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'rgb(var(--theme-text))' }}>
                    {grant.fullName ?? grant.email ?? '알 수 없음'}
                  </p>
                  {grant.email && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'rgb(var(--theme-text-faint))' }}>
                      {grant.email}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleRevoke(grant.userId)}
                  className="yield-revoke-btn"
                >
                  해제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </YieldPanel>
  )
}
