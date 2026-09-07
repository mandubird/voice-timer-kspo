interface ToggleSwitchProps {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  /** 스크린리더용 보조 설명 */
  id?: string
}

/** 설정 화면용 토글 스위치 (가이드: 체크박스 대체) */
export function ToggleSwitch({
  checked,
  onChange,
  label,
  id,
}: ToggleSwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex h-14 min-h-14 w-full min-w-0 flex-1 items-center justify-between gap-3 rounded-[14px] border border-[#E8EAF0] bg-white px-4 text-left transition active:scale-[0.99]"
    >
      <span className="text-[15px] font-medium text-[#111111]">{label}</span>
      <span
        className={[
          'relative inline-flex h-8 w-[52px] shrink-0 rounded-full transition-colors',
          checked ? 'bg-[#2F6BFF]' : 'bg-[#E8EAF0]',
        ].join(' ')}
        aria-hidden
      >
        <span
          className={[
            'absolute top-1 size-6 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'left-[calc(100%-1.75rem)]' : 'left-1',
          ].join(' ')}
        />
      </span>
    </button>
  )
}
