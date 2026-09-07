export type AnnounceMode = 'all' | 'every10' | 'last5' | 'last10'

export interface AnnounceToggleProps {
  value: AnnounceMode
  onChange: (mode: AnnounceMode) => void
}

export function AnnounceToggle({ value, onChange }: AnnounceToggleProps) {
  return (
    <section aria-label="알림 방식" className="mt-6 space-y-3">
      <h2 className="text-sm font-semibold text-[#111111]">알림 방식</h2>
      <div className="grid grid-cols-4 gap-2">
        <ToggleChip
          active={value === 'all'}
          onClick={() => onChange('all')}
          label="매 초"
          sub="매 초 안내"
        />
        <ToggleChip
          active={value === 'every10'}
          onClick={() => onChange('every10')}
          label="10초마다"
          sub="10초마다 안내"
        />
        <ToggleChip
          active={value === 'last5'}
          onClick={() => onChange('last5')}
          label="마지막 5초"
          sub="마지막 5초만"
        />
        <ToggleChip
          active={value === 'last10'}
          onClick={() => onChange('last10')}
          label="마지막 10초"
          sub="마지막 10초만"
        />
      </div>
    </section>
  )
}

interface ToggleChipProps {
  active: boolean
  onClick: () => void
  label: string
  sub?: string
}

/** 동일 높이 카드 3열 (가이드) */
function ToggleChip({ active, onClick, label, sub }: ToggleChipProps) {
  return (
    <button
      type="button"
      className={[
        'flex min-h-[5.75rem] flex-col items-stretch justify-center rounded-[14px] border px-2.5 py-3 text-left text-sm transition',
        active
          ? 'border-[#2F6BFF] bg-[#F3F7FF] text-[#2F6BFF] shadow-sm'
          : 'border-[#E8EAF0] bg-white text-[#111111] hover:border-[#D0D4E0]',
      ].join(' ')}
      onClick={onClick}
    >
      <span className="font-semibold leading-tight">{label}</span>
      {sub ? (
        <span
          className={[
            'mt-1.5 text-[11px] leading-snug',
            active ? 'text-[#2F6BFF]/85' : 'text-[#7A7F8A]',
          ].join(' ')}
        >
          {sub}
        </span>
      ) : null}
    </button>
  )
}
