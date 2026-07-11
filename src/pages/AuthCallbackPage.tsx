import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const { error } = await supabase.auth.getSession()
      if (error) {
        setError(error.message)
        return
      }
      window.location.replace('/')
    }

    handleCallback()
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="panel-light p-8 text-center max-w-md">
          <p className="text-red-400 text-sm mb-4">로그인 처리 중 오류가 발생했습니다.</p>
          <p className="text-slate-500 text-xs mb-6">{error}</p>
          <a href="/" className="btn-primary text-sm inline-block">다시 시도</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-cyber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">로그인 처리 중...</p>
      </div>
    </div>
  )
}
