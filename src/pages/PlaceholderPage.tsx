interface PlaceholderPageProps {
  title: string
  icon: string
  description: string
}

export default function PlaceholderPage({ title, icon, description }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="text-5xl mb-4 drop-shadow-[0_0_20px_rgba(34,211,238,0.3)]">{icon}</span>
      <h1 className="text-2xl font-bold text-slate-100">{title}</h1>
      <p className="text-sm text-slate-500 mt-2 max-w-sm">{description}</p>
      <span className="mt-6 text-xs text-slate-500 bg-dark-panel border border-dark-border px-3 py-1 rounded-full">
        준비 중
      </span>
    </div>
  )
}
