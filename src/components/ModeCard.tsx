import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type ModeCardVisual = 'countdown' | 'countup' | 'interval' | 'brushing'

export interface ModeCardProps {
  to: string
  title: string
  description: string
  icon: LucideIcon
  visual: ModeCardVisual
  locked?: boolean
  onLocked?: () => void
}

const CARD_STYLES: Record<
  ModeCardVisual,
  { card: string; iconWrap: string; title: string; desc: string }
> = {
  countdown: {
    card: 'min-h-[112px] border border-[#C5D9FF]/90 bg-[#EAF1FF] shadow-[0_4px_20px_rgba(47,107,255,0.12)]',
    iconWrap:
      'bg-gradient-to-br from-[#2F6BFF] to-[#5A8BFF] text-white shadow-md shadow-[#2F6BFF]/25',
    title: 'text-[#0F1F4D]',
    desc: 'text-[#4A5B7A]',
  },
  countup: {
    card: 'min-h-[112px] border border-[#DDD0FF]/90 bg-[#F1EDFF] shadow-[0_4px_20px_rgba(122,92,250,0.14)]',
    iconWrap:
      'bg-gradient-to-br from-[#7A5CFA] to-[#9A7BFF] text-white shadow-md shadow-[#7A5CFA]/25',
    title: 'text-[#2D1F5C]',
    desc: 'text-[#5B4D7A]',
  },
  interval: {
    card: 'min-h-[112px] border border-[#FFD4C4]/90 bg-[#FFF0EA] shadow-[0_4px_20px_rgba(255,106,61,0.14)]',
    iconWrap:
      'bg-gradient-to-br from-[#FF6A3D] to-[#FF8A3D] text-white shadow-md shadow-[#FF6A3D]/22',
    title: 'text-[#4A1F12]',
    desc: 'text-[#7A4D3D]',
  },
  brushing: {
    card: 'min-h-[118px] border border-[#B8E4FF]/90 bg-[#EAF8FF] shadow-[0_4px_20px_rgba(85,184,255,0.16)]',
    iconWrap:
      'bg-gradient-to-br from-[#55B8FF] to-[#8ED6FF] text-white shadow-md shadow-[#55B8FF]/25',
    title: 'text-[#0D3A52]',
    desc: 'text-[#3D5C70]',
  },
}

/** 홈 모드 카드 — 모드별 컬러·그라디언트·큰 아이콘 (UI 가이드) */
export function ModeCard({
  to,
  title,
  description,
  icon: Icon,
  visual,
  locked,
  onLocked,
}: ModeCardProps) {
  const s = CARD_STYLES[visual]
  const className = [
    'relative flex items-center gap-4 rounded-card p-5 transition active:scale-[0.99]',
    s.card,
    locked ? 'opacity-80' : '',
  ].join(' ')

  const inner = (
    <>
      <span
        className={[
          'flex size-[52px] shrink-0 items-center justify-center rounded-2xl',
          s.iconWrap,
        ].join(' ')}
        aria-hidden
      >
        <Icon className="size-10" strokeWidth={2.25} />
      </span>
      <div className="min-w-0 flex-1 text-left">
        <p className={`text-lg font-bold tracking-tight ${s.title}`}>{title}</p>
        <p className={`mt-1 text-sm leading-snug ${s.desc}`}>{description}</p>
      </div>
      {locked && (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-black/10">
          <Lock className="size-4 text-black/50" strokeWidth={2.5} />
        </span>
      )}
    </>
  )

  if (locked) {
    return (
      <button type="button" className={`w-full text-left ${className}`} onClick={onLocked}>
        {inner}
      </button>
    )
  }

  return (
    <Link to={to} className={className}>
      {inner}
    </Link>
  )
}
