import HuntAlertSection from '../components/alert/HuntAlertSection'

interface AlertPageProps {
  onGoHunt: () => void
}

export default function AlertPage({ onGoHunt }: AlertPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">알리미</h1>
        <p className="text-sm text-slate-500 mt-1">여러 타이머를 동시에 돌릴 수 있습니다</p>
      </div>
      <HuntAlertSection onGoHunt={onGoHunt} />
    </div>
  )
}
