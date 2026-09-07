import { Lock } from 'lucide-react'
import type { PresetCategory } from '../types'

const CATEGORY_LABEL: Record<PresetCategory, string> = {
  workout: '운동',
  kitchen: '생활',
  brushing: '양치',
  meditation: '명상',
  sleep: '수면',
  asmr: 'ASMR',
  custom: '내 루틴',
}

const CATEGORY_STYLE: Record<PresetCategory, string> = {
  workout: 'bg-toss-blue/10 text-toss-blue',
  kitchen: 'bg-workout-rest/15 text-workout-rest',
  brushing: 'bg-brushing-primary/15 text-brushing-primary',
  meditation: 'bg-[#D9D0FF]/40 text-[#4A3D7A]',
  sleep: 'bg-[#C8D5FF]/50 text-[#0D1A40]',
  asmr: 'bg-[#B8EFE0]/50 text-[#0A2E22]',
  custom: 'bg-toss-gray text-toss-sub',
}

export interface PresetCardProps {
  emoji?: string
  title: string
  description: string
  category: PresetCategory
  onClick: () => void
  locked?: boolean
}

export function PresetCard({
  emoji,
  title,
  description,
  category,
  onClick,
  locked,
}: PresetCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full rounded-[18px] border border-toss-border bg-white p-4 text-left shadow-[var(--shadow-card)] transition active:scale-[0.99]',
        locked ? 'opacity-75' : '',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-3xl" aria-hidden>
          {emoji ?? '⏱'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-extrabold leading-snug text-[#111111]">
            {title}
          </p>
          <p className="mt-1 line-clamp-1 text-sm font-medium text-[#7A7F8A]">
            {description}
          </p>
          <span
            className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${CATEGORY_STYLE[category]}`}
          >
            [{CATEGORY_LABEL[category]}]
          </span>
        </div>
        {locked && (
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-black/10">
            <Lock className="size-4 text-black/50" strokeWidth={2.5} />
          </span>
        )}
      </div>
    </button>
  )
}
