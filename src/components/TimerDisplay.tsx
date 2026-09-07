interface TimerDisplayProps {
  value: number | string
  unitLabel?: string
  /** 보조 한 줄 (라운드, 모드 등) */
  subtitle?: string
  className?: string
  /** 세션 실행 화면용 초대형 숫자 */
  variant?: 'default' | 'session'
}

/** 타이머 디스플레이 — session: clamp 숫자 + 단위 서브스크립트 느낌 (UI 가이드) */
export function TimerDisplay({
  value,
  unitLabel,
  subtitle,
  className = '',
  variant = 'default',
}: TimerDisplayProps) {
  if (variant === 'session') {
    return (
      <div
        className={`mx-auto flex w-full flex-col items-center justify-center ${className}`}
      >
        <div className="relative flex min-h-[min(52dvh,420px)] w-full flex-1 flex-col items-center justify-center">
          {/* 소프트 글로우 */}
          <div
            className="pointer-events-none absolute inset-0 mx-auto max-w-sm rounded-full bg-[radial-gradient(ellipse_at_center,rgba(47,107,255,0.12)_0%,transparent_70%)]"
            aria-hidden
          />
          <div className="relative z-[1] flex items-end justify-center gap-1 px-2">
            <span
              className="font-black tabular-nums tracking-tighter text-[#101828]"
              style={{
                fontSize: 'clamp(120px, 40vw, 200px)',
                lineHeight: 0.88,
              }}
            >
              {value}
            </span>
            {unitLabel ? (
              <span className="mb-[clamp(12px,3vw,28px)] text-xl font-semibold text-[#7A7F8A] sm:text-2xl">
                {unitLabel}
              </span>
            ) : null}
          </div>
        </div>
        {subtitle ? (
          <p className="mt-4 max-w-sm text-center text-xs font-medium text-[#7A7F8A] sm:text-sm">
            {subtitle}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="flex items-baseline justify-center gap-1">
        <span className="text-[80px] font-bold leading-none tracking-tight text-toss-text sm:text-[96px]">
          {value}
        </span>
        {unitLabel ? (
          <span className="text-lg font-medium text-toss-sub">{unitLabel}</span>
        ) : null}
      </div>
      {subtitle ? (
        <p className="mt-2 text-center text-sm text-toss-sub">{subtitle}</p>
      ) : null}
    </div>
  )
}
