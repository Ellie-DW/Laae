import { getToday, parseMesoInput } from '../../utils'

interface RecordFormProps {
  onSubmit: (data: { amount: number; recordDate: string; memo: string }) => void | Promise<void>
  amountLabel?: string
  amountPlaceholder?: string
  children?: React.ReactNode
  submitLabel?: string
}

export default function MesoRecordForm({
  onSubmit,
  amountLabel = '금액 (억 단위)',
  amountPlaceholder = '예: 1, 0.5, 1.5억',
  children,
  submitLabel = '추가',
}: RecordFormProps) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const amount = parseMesoInput(String(fd.get('amount') ?? ''))
    if (amount <= 0) return
    await onSubmit({
      amount,
      recordDate: String(fd.get('recordDate') ?? getToday()),
      memo: String(fd.get('memo') ?? '').trim(),
    })
    form.reset()
    const dateInput = form.querySelector<HTMLInputElement>('input[name="recordDate"]')
    if (dateInput) dateInput.value = getToday()
  }

  return (
    <form onSubmit={handleSubmit} className="panel-light p-4 space-y-3">
      {children}
      <div>
        <label className="text-xs text-slate-500 mb-1 block">{amountLabel}</label>
        <input name="amount" required placeholder={amountPlaceholder} className="input-field text-sm" />
      </div>
      <div>
        <label className="text-xs text-slate-500 mb-1 block">날짜</label>
        <input name="recordDate" type="date" defaultValue={getToday()} className="input-field text-sm" />
      </div>
      <div>
        <label className="text-xs text-slate-500 mb-1 block">메모 (선택)</label>
        <input name="memo" placeholder="메모" className="input-field text-sm" />
      </div>
      <button type="submit" className="btn-primary text-sm w-full py-2">{submitLabel}</button>
    </form>
  )
}
