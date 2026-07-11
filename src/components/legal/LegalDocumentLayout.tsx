import { SITE_NAME } from '../../lib/site'
import SiteFooter from '../layout/SiteFooter'

interface LegalSection {
  title: string
  paragraphs: string[]
  list?: string[]
}

interface LegalDocumentLayoutProps {
  title: string
  effectiveDate: string
  intro: string
  sections: LegalSection[]
}

export default function LegalDocumentLayout({
  title,
  effectiveDate,
  intro,
  sections,
}: LegalDocumentLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 p-4 lg:p-8 max-w-3xl mx-auto w-full">
        <a
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-cyber-400 transition-colors mb-6"
        >
          ← {SITE_NAME}으로 돌아가기
        </a>

        <div className="panel-light p-6 lg:p-8">
          <h1 className="text-2xl font-bold text-slate-100">{title}</h1>
          <p className="text-xs text-slate-500 mt-2">시행일: {effectiveDate}</p>
          <p className="text-sm text-slate-400 mt-4 leading-relaxed">{intro}</p>

          <div className="mt-8 space-y-8">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-base font-semibold text-slate-200">{section.title}</h2>
                <div className="mt-3 space-y-3">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-sm text-slate-400 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                  {section.list && (
                    <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-400 leading-relaxed">
                      {section.list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter compact />
    </div>
  )
}
