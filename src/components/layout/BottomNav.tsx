import type { Page } from '../../types'
import { NAV_ITEMS } from './nav'

interface BottomNavProps {
  currentPage: Page
  onNavigate: (page: Page) => void
}

export default function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-dark-surface/90 backdrop-blur-lg border-t border-dark-border/60 z-50 safe-bottom">
      <div className="flex overflow-x-auto scrollbar-hide">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-0.5 min-w-[4.5rem] py-2 px-1 text-[10px] transition-all duration-200 ${
              currentPage === item.id
                ? 'text-cyber-400 font-semibold'
                : 'text-slate-500'
            }`}
          >
            <span className={`text-lg ${currentPage === item.id ? 'drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]' : ''}`}>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
