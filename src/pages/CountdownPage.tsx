import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { AnnounceToggle } from '../components/AnnounceToggle'
import { ToggleSwitch } from '../components/ToggleSwitch'
import { useSessionStore } from '../store/sessionStore'
import { useSettingsStore, getVoiceProfileFromPack } from '../store/settingsStore'
import { primeSpeechFromUserGesture } from '../utils/sessionSpeechPrime'
import type { CountdownSettings } from '../types'

const chip = (on: boolean) =>
  on
    ? 'border-[#2F6BFF] bg-[#F3F7FF] text-[#2F6BFF] shadow-sm'
    : 'border-[#E8EAF0] bg-white text-[#111111] hover:border-[#D0D4E0]'

export default function CountdownPage() {
  const navigate = useNavigate()
  const audioPack = useSettingsStore((s) => s.audioPack)
  const [settings, setSettings] = useState<Omit<CountdownSettings, 'voiceProfile'>>({
    duration: 60,
    announceMode: 'every10',
    vibration: true,
    sound: true,
  })

  const setDuration = (sec: number) =>
    setSettings((prev) => ({ ...prev, duration: sec }))

  return (
    <PageShell title="카운트다운">
      <div className="space-y-6 text-[#111111]">
        <section className="rounded-[18px] border border-[#E8EAF0] bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[#111111]">시간</h2>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[30, 45, 60, 90].map((sec) => (
              <button
                key={sec}
                type="button"
                className={[
                  'min-h-12 rounded-[14px] border px-2 py-3 text-sm font-semibold transition',
                  chip(settings.duration === sec),
                ].join(' ')}
                onClick={() => setDuration(sec)}
              >
                {sec}초
              </button>
            ))}
          </div>
        </section>

        <div className="rounded-[18px] border border-[#E8EAF0] bg-white p-4 shadow-sm">
          <AnnounceToggle
            value={settings.announceMode}
            onChange={(announceMode) => setSettings((p) => ({ ...p, announceMode }))}
          />
        </div>

        <section className="flex gap-3">
          <ToggleSwitch
            label="진동"
            checked={settings.vibration}
            onChange={(vibration) => setSettings((p) => ({ ...p, vibration }))}
          />
          <ToggleSwitch
            label="소리"
            checked={settings.sound}
            onChange={(sound) => setSettings((p) => ({ ...p, sound }))}
          />
        </section>

        <div className="pt-4">
          <button
            type="button"
            className="flex h-14 w-full items-center justify-center rounded-[14px] bg-gradient-to-r from-[#2F6BFF] to-[#4A7CFF] text-[17px] font-bold text-white shadow-lg shadow-[#2F6BFF]/30"
            onClick={() => {
              const cfg = { mode: 'countdown' as const, settings: { ...settings, voiceProfile: getVoiceProfileFromPack(audioPack) } }
              primeSpeechFromUserGesture(cfg)
              useSessionStore.getState().loadSession(cfg, { startPaused: true })
              navigate('/session')
              window.setTimeout(() => useSessionStore.getState().resume(), 2400)
            }}
          >
            시작하기
          </button>
        </div>
      </div>
    </PageShell>
  )
}
