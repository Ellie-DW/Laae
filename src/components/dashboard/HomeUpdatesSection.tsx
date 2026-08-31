import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
  checkSiteUpdateOwner,
  createSiteUpdate,
  deleteSiteUpdate,
  fetchSiteUpdates,
} from '../../lib/siteUpdatesApi'
import { formatUpdateDate, hasUnseenUpdate, markUpdateSeen, type SiteUpdate } from '../../lib/updates'
import { getToday } from '../../utils'

export default function HomeUpdatesSection() {
  const { user } = useAuth()
  const [updates, setUpdates] = useState<SiteUpdate[]>([])
  const [isOwner, setIsOwner] = useState(false)
  const [open, setOpen] = useState(false)
  const [writing, setWriting] = useState(false)
  const [unseen, setUnseen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const latest = updates[0]

  const load = async () => {
    try {
      const rows = await fetchSiteUpdates()
      setUpdates(rows)
      setUnseen(hasUnseenUpdate(rows[0]?.id))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '업데이트를 불러오지 못했어요')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    if (!user) {
      setIsOwner(false)
      return
    }
    checkSiteUpdateOwner()
      .then(setIsOwner)
      .catch(() => setIsOwner(false))
  }, [user])

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next && latest && unseen) {
      markUpdateSeen(latest.id)
      setUnseen(false)
    }
  }

  if (!latest && !isOwner) return null

  return (
    <section className="panel-light p-4 h-fit">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-sm font-semibold text-slate-100">최신 업데이트</h2>
        <div className="flex items-center gap-2">
          {unseen && <span className="w-1.5 h-1.5 rounded-full bg-cyber-400" aria-label="새 소식" />}
          {isOwner && (
            <button
              type="button"
              onClick={() => setWriting((prev) => !prev)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              {writing ? '닫기' : '쓰기'}
            </button>
          )}
        </div>
      </div>

      {writing && isOwner && (
        <UpdateComposer
          onCreated={async () => {
            await load()
            setWriting(false)
            setOpen(true)
          }}
        />
      )}

      {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

      {latest ? (
        <>
          <button type="button" onClick={toggle} className="w-full text-left">
            <p className="text-xs text-slate-500 tabular-nums">{formatUpdateDate(latest.date)}</p>
            <p className="mt-1 text-sm text-slate-200 leading-snug">{latest.title}</p>
            <p className="mt-2 text-xs text-cyber-400">{open ? '접기' : '이전 기록'}</p>
          </button>

          {open && (
            <ol className="mt-3 space-y-3 border-t border-dark-border/50 pt-3">
              {updates.map((update) => (
                <li key={update.id} className="relative pl-3">
                  <span className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-slate-600" />
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-500 tabular-nums">{formatUpdateDate(update.date)}</p>
                      <p className="text-xs text-slate-300 mt-0.5">{update.title}</p>
                      <ul className="mt-1 space-y-0.5">
                        {update.items.map((item) => (
                          <li key={item} className="text-[11px] text-slate-500">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm('이 글을 지울까요?')) return
                          try {
                            await deleteSiteUpdate(update.id)
                            await load()
                          } catch (err) {
                            setError(err instanceof Error ? err.message : '지우지 못했어요')
                          }
                        }}
                        className="text-[11px] text-slate-500 hover:text-red-400 shrink-0"
                      >
                        지우기
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </>
      ) : (
        <p className="text-xs text-slate-500">아직 올린 글이 없어요</p>
      )}
    </section>
  )
}

function UpdateComposer({ onCreated }: { onCreated: () => Promise<void> }) {
  const [date, setDate] = useState(getToday())
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmedTitle = title.trim()
    const items = body
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    if (!trimmedTitle) return

    setSubmitting(true)
    setError(null)
    try {
      await createSiteUpdate({ date, title: trimmedTitle, items })
      setTitle('')
      setBody('')
      await onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : '올리지 못했어요')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-3 space-y-2 border-b border-dark-border/50 pb-3">
      <input
        type="date"
        value={date}
        onChange={(event) => setDate(event.target.value)}
        className="input-field text-xs py-1.5"
      />
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="제목"
        className="input-field text-sm"
      />
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="한 줄에 하나씩"
        rows={3}
        className="input-field text-sm resize-none"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !title.trim()}
        className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50"
      >
        {submitting ? '올리는 중' : '올리기'}
      </button>
    </form>
  )
}
