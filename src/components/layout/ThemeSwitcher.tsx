import { THEME_OPTIONS } from '../../lib/theme'
import { useTheme } from '../../contexts/ThemeContext'

interface ThemeSwitcherProps {
  compact?: boolean
}

export default function ThemeSwitcher({ compact = false }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme()

  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
      {!compact && (
        <p className="text-xs font-medium text-slate-500 px-1 uppercase tracking-wider">테마</p>
      )}
      <div className={`grid grid-cols-3 gap-1 ${compact ? '' : 'px-0.5'}`}>
        {THEME_OPTIONS.map((option) => {
          const active = theme === option.id
          return (
            <button
              key={option.id}
              type="button"
              data-theme-tab
              data-active={active}
              onClick={() => setTheme(option.id)}
              title={option.description}
              className={`rounded-lg border text-xs transition-all ${
                compact ? 'px-2 py-1.5' : 'px-2 py-2'
              } ${
                active
                  ? 'border-cyber-500/40 bg-cyber-500/15 text-cyber-300 font-semibold shadow-neon-sm'
                  : 'border-dark-border bg-dark-surface/50 text-slate-500 hover:text-slate-300 hover:border-dark-border/80'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
