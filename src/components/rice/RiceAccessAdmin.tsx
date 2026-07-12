import { useState } from 'react'
import type { RiceAccessGrant } from '../../lib/riceAccessApi'

interface RiceAccessAdminProps {
  grants: RiceAccessGrant[]
  onGrant: (email: string) => Promise<void>
  onRevoke: (userId: string) => Promise<void>
}

export default function RiceAccessAdmin({ grants, onGrant, onRevoke }: RiceAccessAdminProps) {
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
    if (!confirm('이 사용자의 쌀곳간 권한을 해제할까요?')) return
    setError(null)
    try {
      await onRevoke(userId)
    } catch (err) {
      setError(err instanceof Error ? err.message : '권한 해제에 실패했습니다.')
    }
  }

  return (
    <div className="panel-light p-5 space-y-4">
      <div>
        <h2 className="font-semibold text-slate-100">쌀곳간 권한 관리</h2>
        <p className="text-xs text-slate-500 mt-1">권한을 받은 사용자만 쌀곳간 탭이 보여요</p>
      </div>

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
          className="btn-primary text-sm px-4 py-2 disabled:opacity-50 shrink-0"
        >
          {submitting ? '...' : '권한 부여'}
        </button>
      </form>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {grants.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">권한을 받은 사용자가 없어요</p>
      ) : (
        <div className="space-y-2">
          {grants.map((grant) => (
            <div
              key={grant.userId}
              className="flex items-center gap-3 p-3 rounded-lg bg-dark-surface/50 border border-dark-border"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {grant.fullName ?? grant.email ?? '알 수 없음'}
                </p>
                {grant.email && (
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{grant.email}</p>
                )}
              </div>
              <button
                onClick={() => handleRevoke(grant.userId)}
                className="text-xs text-slate-500 hover:text-red-400 shrink-0"
              >
                해제
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
