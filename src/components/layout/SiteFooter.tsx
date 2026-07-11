import { SITE_LOGO_SRC } from '../../lib/assetImages'
import { LEGAL_PATHS, OPEN_KAKAO_URL, SITE_NAME, SITE_TAGLINE } from '../../lib/site'

interface SiteFooterProps {
  compact?: boolean
}

export default function SiteFooter({ compact = false }: SiteFooterProps) {
  const year = new Date().getFullYear()

  return (
    <footer
      className={`border-t border-dark-border/40 ${
        compact ? 'px-4 py-6' : 'px-4 lg:px-6 py-8 mt-8'
      }`}
    >
      <div
        className={`mx-auto w-full ${
          compact ? 'max-w-md' : 'max-w-5xl'
        }`}
      >
        <div
          className={`flex flex-col gap-4 ${
            compact ? 'items-center text-center' : 'sm:flex-row sm:items-start sm:justify-between'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <img src={SITE_LOGO_SRC} alt="" className="w-7 h-7 object-contain shrink-0" draggable={false} />
            <div className="min-w-0 text-left">
              <p className="font-display font-bold text-slate-200 tracking-wide">{SITE_NAME}</p>
              <p className="text-xs text-slate-500">{SITE_TAGLINE}</p>
            </div>
          </div>

          <div className={`flex flex-col gap-3 ${compact ? 'items-center' : 'sm:items-end'}`}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 justify-center sm:justify-end">
              <a href={LEGAL_PATHS.privacy} className="hover:text-cyber-400 transition-colors">
                개인정보처리방침
              </a>
              <span className="text-slate-700">·</span>
              <a href={LEGAL_PATHS.terms} className="hover:text-cyber-400 transition-colors">
                이용약관
              </a>
              <span className="text-slate-700 hidden sm:inline">·</span>
              <span className="text-slate-600 hidden sm:inline">© {year} {SITE_NAME}</span>
            </div>

            <a
              href={OPEN_KAKAO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#FEE500] px-3 py-2 text-[#191919] hover:brightness-95 transition-all"
              aria-label="Laae 오픈카톡 문의"
            >
              <KakaoIcon />
              <span className="text-xs font-semibold">오픈카톡 문의</span>
            </a>

            <p className="text-[11px] text-slate-600 leading-relaxed max-w-sm">
              {SITE_NAME}는 넥슨이 운영하는 공식 서비스가 아닙니다.
            </p>
            <p className="text-[10px] text-slate-700">
              Data based on NEXON Open API
            </p>
            {compact && <span className="text-xs text-slate-600 sm:hidden">© {year} {SITE_NAME}</span>}
          </div>
        </div>
      </div>
    </footer>
  )
}

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#191919"
        d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.87 5.34 4.69 6.78-.15.55-.54 1.98-.62 2.28-.1.38.14.37.29.27.12-.08 1.92-1.3 2.7-1.82.55.08 1.12.12 1.71.12 5.52 0 10-3.58 10-8.03C20.07 6.58 15.59 3 12 3z"
      />
    </svg>
  )
}
