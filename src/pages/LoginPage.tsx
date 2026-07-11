import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { SITE_LOGO_SRC } from '../lib/assetImages'

export default function LoginPage() {
  const { signInWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="panel-glow p-8 text-center">
          <img
            src={SITE_LOGO_SRC}
            alt=""
            className="w-16 h-16 mx-auto mb-4 object-contain drop-shadow-[0_0_20px_rgba(34,211,238,0.3)]"
            draggable={false}
          />
          <h1 className="font-display text-2xl font-bold text-slate-100 tracking-wide">
            Maple Diary
          </h1>
          <p className="text-sm text-slate-500 mt-2 mb-8">메이플 가게부에 오신 것을 환영합니다</p>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50
                       text-gray-800 font-medium px-6 py-3 rounded-lg transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <GoogleIcon />
            {loading ? '로그인 중...' : 'Google로 계속하기'}
          </button>

          {error && (
            <p className="mt-4 text-sm text-red-400">{error}</p>
          )}

          <p className="mt-6 text-xs text-slate-600">
            로그인하면 캐릭터 데이터가 계정에 안전하게 저장됩니다
          </p>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}
