import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { ToggleSwitch } from '../components/ToggleSwitch'
import { useSessionStore } from '../store/sessionStore'
import { useSettingsStore, getVoiceProfileFromPack } from '../store/settingsStore'
import { primeSpeechFromUserGesture } from '../utils/sessionSpeechPrime'
import type { BrushingSettings } from '../types'
import { BRUSHING_TOTAL_SECONDS } from '../constants/brushing'

export default function BrushingPage() {
  const navigate = useNavigate()
  const isPro = useSettingsStore((s) => s.isPro)
  const openPaywall = useSettingsStore((s) => s.openPaywall)
  const audioPack = useSettingsStore((s) => s.audioPack)
  const [settings, setSettings] = useState<Omit<BrushingSettings, 'voiceProfile'>>({
    sound: true,
    durationSeconds: BRUSHING_TOTAL_SECONDS as 120 | 180,
  })

  if (!isPro) {
    return (
      <PageShell title="양치 코치" backLabel="홈">
        <div className="space-y-5 px-2 py-4 text-center">
          <p className="text-lg font-extrabold text-[#111111]">양치 코치는 Pro 전용이에요</p>
          <p className="text-[15px] leading-relaxed text-[#5C6370]">
            앞니·위쪽·마무리까지 단계별로 음성 안내를 받을 수 있어요.
          </p>
          <button
            type="button"
            className="mt-2 w-full max-w-xs rounded-[14px] bg-[#2F6BFF] py-4 text-[16px] font-bold text-white shadow-lg shadow-[#2F6BFF]/25"
            onClick={() => openPaywall('양치 코치')}
          >
            Pro로 이용하기
          </button>
          <button
            type="button"
            className="w-full py-3 text-[14px] font-medium text-[#7A7F8A]"
            onClick={() => navigate('/')}
          >
            홈으로
          </button>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell title="양치 코치">
      <div className="space-y-6 text-[#111111]">
        <section className="rounded-[18px] border border-[#B8E4FF]/80 bg-[#EAF8FF] px-4 py-5 text-center shadow-sm">
          <p className="text-sm font-medium text-[#3D5C70]">양치 시간</p>
          <p className="mt-1 text-3xl font-extrabold text-[#0D3A52]">
            {settings.durationSeconds / 60}분
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[#5C7A8C]">
            치과 권장 기준에 맞춰 앞니·위쪽·마무리까지 단계별로 안내해요.
          </p>
        </section>

        <section className="rounded-[18px] border border-[#E8EAF0] bg-white p-4 shadow-sm">
          <ToggleSwitch
            label="음성"
            checked={settings.sound}
            onChange={(sound) => setSettings((p) => ({ ...p, sound }))}
          />
        </section>

        <div className="flex justify-center pt-6">
          <button
            type="button"
            className="flex h-[120px] w-full max-w-xs items-center justify-center rounded-[24px] bg-gradient-to-br from-[#55B8FF] to-[#8ED6FF] text-2xl font-bold text-white shadow-xl shadow-[#55B8FF]/35 transition active:scale-[0.99]"
            onClick={() => {
              const cfg = { mode: 'brushing' as const, settings: { ...settings, voiceProfile: getVoiceProfileFromPack(audioPack) } }
              primeSpeechFromUserGesture(cfg)
              useSessionStore.getState().loadSession(cfg, {
                brushingSkipScriptTriggers: settings.sound ? [0] : [],
                startPaused: true,
              })
              navigate('/session')
              window.setTimeout(() => useSessionStore.getState().resume(), 2400)
            }}
          >
            양치 시작하기 🪥
          </button>
        </div>
      </div>
    </PageShell>
  )
}
