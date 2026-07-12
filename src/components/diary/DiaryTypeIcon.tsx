import type { DiaryEntryType } from '../../lib/diaryEntries'
import { getDiaryTypeMeta } from '../../lib/diaryEntries'
import RiceIcon from '../rice/RiceIcon'

interface DiaryTypeIconProps {
  type: DiaryEntryType
  className?: string
  riceSize?: 'xs' | 'sm' | 'md' | 'lg'
}

export default function DiaryTypeIcon({ type, className = '', riceSize = 'xs' }: DiaryTypeIconProps) {
  if (type === 'rice') {
    return <RiceIcon size={riceSize} className={className} />
  }

  return <span className={className}>{getDiaryTypeMeta(type).icon}</span>
}
