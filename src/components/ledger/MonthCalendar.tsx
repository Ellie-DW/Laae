import type { CalendarCell } from '../../lib/monthCalendar'
import type { SolErdaMonthStats } from '../../lib/huntStats'
import { SolErdaMonthSummary } from '../diary/SolErdaMonthSummary'
import { getWeekdayLabels } from '../../lib/monthCalendar'
import { formatMeso, formatMesoKorean } from '../../utils'

interface MonthCalendarProps {
  year: number
  month: number
  weeks: CalendarCell[][]
  monthTotal: { income: number; expense: number; net: number }
  solErdaSummary?: SolErdaMonthStats
  selectedDate: string | null
  onSelectDate: (date: string) => void
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
}

export default function MonthCalendar({
  year,
  month,
  weeks,
  monthTotal,
  solErdaSummary,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onToday,
}: MonthCalendarProps) {
  const weekdays = getWeekdayLabels()

  return (
    <div className="panel-light overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-dark-border">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded bg-cyber-700 text-white text-sm font-bold">{year}</span>
          <span className="text-2xl font-bold text-cyber-400">{month}월</span>
        </div>
        <div className="flex items-center gap-1">
          <NavBtn onClick={onPrevMonth}>‹</NavBtn>
          <button
            onClick={onToday}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 border border-dark-border rounded-lg hover:bg-dark-surface/50"
          >
            오늘
          </button>
          <NavBtn onClick={onNextMonth}>›</NavBtn>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-dark-border">
        {weekdays.map((label, i) => (
          <div
            key={label}
            className={`py-2 text-center text-xs font-semibold ${
              i === 0
                ? 'bg-red-900/40 text-red-300'
                : i === 6
                  ? 'bg-cyber-900/40 text-cyber-300'
                  : 'bg-cyber-800/50 text-slate-200'
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="divide-y divide-dark-border">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 divide-x divide-dark-border">
            {week.map((cell) => (
              <button
                key={cell.date}
                onClick={() => onSelectDate(cell.date)}
                className={`min-h-[4.5rem] sm:min-h-[5.5rem] p-1.5 text-left transition-colors ${
                  selectedDate === cell.date
                    ? 'bg-cyber-500/15 ring-1 ring-inset ring-cyber-500/40'
                    : 'hover:bg-dark-surface/40'
                } ${!cell.inMonth ? 'bg-dark-surface/20' : ''}`}
              >
                <span
                  className={`text-sm font-medium leading-none ${
                    !cell.inMonth
                      ? 'text-slate-600'
                      : cell.isSunday
                        ? 'text-red-400'
                        : cell.isSaturday
                          ? 'text-cyber-400'
                          : 'text-slate-200'
                  } ${cell.isToday && cell.inMonth ? 'underline decoration-cyber-400' : ''}`}
                >
                  {cell.day}
                </span>

                {cell.entryCount > 0 && cell.inMonth && (
                  <div className="mt-1 space-y-0.5">
                    {cell.income > 0 && (
                      <p className="text-[9px] sm:text-[10px] text-cyber-400 truncate leading-tight">
                        +{formatMeso(cell.income)}
                      </p>
                    )}
                    {cell.expense > 0 && (
                      <p className="text-[9px] sm:text-[10px] text-red-400 truncate leading-tight">
                        -{formatMeso(cell.expense)}
                      </p>
                    )}
                    <p className={`text-[9px] sm:text-[10px] font-semibold truncate leading-tight ${
                      cell.net >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {formatMeso(cell.net)}
                    </p>
                  </div>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-dark-border bg-dark-surface/30 space-y-3">
        <div>
          <p className="text-xs text-slate-500 mb-2">이번 달 합계</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-cyber-400">수익 +{formatMesoKorean(monthTotal.income)}</span>
            <span className="text-red-400">지출 -{formatMesoKorean(monthTotal.expense)}</span>
            <span className={`font-semibold ${monthTotal.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              순수익 {formatMesoKorean(monthTotal.net)}
            </span>
          </div>
        </div>
        {solErdaSummary && (
          <div className="pt-3 border-t border-dark-border/60">
            <p className="text-xs text-slate-500 mb-2">솔 에르다 조각 · 이번 달</p>
            <SolErdaMonthSummary summary={solErdaSummary} compact />
          </div>
        )}
      </div>
    </div>
  )
}

function NavBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-dark-surface/50 rounded-lg text-lg"
    >
      {children}
    </button>
  )
}
