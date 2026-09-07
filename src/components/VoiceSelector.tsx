import { useSettingsStore } from '../store/settingsStore'

const sel = (on: boolean) =>
  on
    ? 'border-[#2F6BFF] bg-[#F3F7FF] text-[#2F6BFF] shadow-sm'
    : 'border-[#E8EAF0] bg-white text-[#111111] hover:border-[#D0D4E0]'

/** 전역 음성 톤 선택 — settingsStore의 audioPack을 직접 읽고 씀 */
export function VoiceSelector() {
  // PRO_HIDDEN: 프리미엄 목소리 옵션 숨김 처리 — Pro 활성화 시 isPro/openPaywall/premium 버튼 복구
  const audioPack = useSettingsStore((s) => s.audioPack)
  const setAudioPack = useSettingsStore((s) => s.setAudioPack)

  return (
    <section aria-label="음성 톤 설정" className="mt-6 space-y-3">
      <h2 className="text-sm font-semibold text-[#111111]">음성 톤</h2>

      <div className="flex gap-2">
        <button
          type="button"
          className={[
            'min-h-12 flex-1 rounded-[14px] border px-3 py-2.5 text-sm font-semibold transition',
            sel(audioPack === 'default' || audioPack === 'none'),
          ].join(' ')}
          onClick={() => setAudioPack('default')}
        >
          기본 목소리
        </button>
      </div>

      <p className="text-xs text-[#7A7F8A] leading-relaxed">차분한 여성 목소리로 안내해요</p>
    </section>
  )
}
