import type { ReactNode } from 'react'

type PanelAccent = 'krw' | 'usd' | 'violet' | 'neutral'
type StatAccent = 'krw' | 'usd' | 'profit' | 'violet' | 'neutral'

export function YieldPageHeader({ recordCount }: { recordCount: number }) {
  return (
    <header className="yield-hero">
      <div className="yield-hero-glow-a" />
      <div className="yield-hero-glow-b" />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="yield-hero-badge">
            <span className="yield-hero-badge-dot" />
            투자 수익 트래킹
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'rgb(var(--theme-text))' }}>
            수익률 가계부
          </h1>
          <p className="text-sm mt-2 max-w-xl leading-relaxed" style={{ color: 'rgb(var(--theme-text-muted))' }}>
            업비트·바이낸스 잔고와 환율을 기록하면 원화·달러 수익금과 수익률이 자동으로 계산됩니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="yield-hero-chip">
            기록 <strong className="ml-1 tabular-nums" style={{ color: 'rgb(var(--theme-text))' }}>{recordCount}일</strong>
          </span>
          <span className="yield-hero-chip">
            거래소 <strong className="ml-1" style={{ color: 'rgb(var(--theme-text))' }}>업비트 · 바이낸스</strong>
          </span>
        </div>
      </div>
    </header>
  )
}

export function YieldPanel({
  title,
  description,
  accent = 'neutral',
  action,
  children,
  className = '',
}: {
  title: string
  description?: string
  accent?: PanelAccent
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  const accentClass =
    accent === 'neutral' ? 'yield-panel' : `yield-panel yield-panel--${accent}`

  return (
    <section className={`${accentClass} ${className}`}>
      <div className="yield-panel-head">
        <div className="flex items-start gap-3 min-w-0">
          <span className={`yield-panel-dot yield-panel-dot--${accent}`} />
          <div>
            <h2 className="font-semibold" style={{ color: 'rgb(var(--theme-text))' }}>
              {title}
            </h2>
            {description && (
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'rgb(var(--theme-text-faint))' }}>
                {description}
              </p>
            )}
          </div>
        </div>
        {action}
      </div>
      <div className="yield-panel-body">{children}</div>
    </section>
  )
}

export function YieldStatCard({
  label,
  value,
  sub,
  accent = 'neutral',
  tone = 'default',
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  accent?: StatAccent
  tone?: 'default' | 'profit' | 'loss' | 'krw' | 'usd' | 'violet'
}) {
  const toneClass =
    tone === 'profit'
      ? 'yield-stat-value--profit'
      : tone === 'loss'
        ? 'yield-stat-value--loss'
        : tone === 'krw'
          ? 'yield-stat-value--krw'
          : tone === 'usd'
            ? 'yield-stat-value--usd'
            : tone === 'violet'
              ? 'yield-stat-value--violet'
              : ''

  return (
    <div className={`yield-stat-card yield-stat-card--${accent}`}>
      <p className="yield-stat-label">{label}</p>
      <p className={`yield-stat-value ${toneClass}`.trim()}>{value}</p>
      {sub && <p className="yield-stat-sub">{sub}</p>}
    </div>
  )
}

export function YieldExchangeCard({
  label,
  badge,
  variant,
  children,
}: {
  label: string
  badge: string
  variant: 'upbit' | 'binance'
  children: ReactNode
}) {
  return (
    <div className="yield-exchange-card">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold" style={{ color: 'rgb(var(--theme-text-secondary))' }}>
          {label}
        </p>
        <span className={`yield-exchange-badge yield-exchange-badge--${variant}`}>{badge}</span>
      </div>
      {children}
    </div>
  )
}

export function YieldPreviewStrip({ children }: { children: ReactNode }) {
  return (
    <div className="yield-preview">
      <p className="yield-preview-title">저장 전 미리보기</p>
      <div className="yield-preview-items">{children}</div>
    </div>
  )
}

export function YieldPreviewItem({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: ReactNode
  tone?: 'neutral' | 'positive' | 'negative' | 'deposit' | 'withdraw'
}) {
  const toneStyle =
    tone === 'positive'
      ? { color: 'rgb(var(--yield-profit))' }
      : tone === 'negative'
        ? { color: 'rgb(var(--yield-loss))' }
        : tone === 'deposit'
          ? { color: 'rgb(var(--yield-deposit))' }
          : tone === 'withdraw'
            ? { color: 'rgb(var(--yield-withdraw))' }
            : { color: 'rgb(var(--theme-text))' }

  return (
    <span style={{ color: 'rgb(var(--theme-text-muted))' }}>
      {label} <strong className="ml-1 tabular-nums" style={toneStyle}>{value}</strong>
    </span>
  )
}

export function YieldSectionHeader({ title, variant = 'accent' }: { title: string; variant?: 'accent' | 'usd' }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <h2 className="yield-section-title">{title}</h2>
      <div
        className="yield-section-divider"
        style={
          variant === 'usd'
            ? { backgroundImage: 'linear-gradient(to right, rgb(var(--yield-usd) / 0.35), transparent)' }
            : undefined
        }
      />
    </div>
  )
}
