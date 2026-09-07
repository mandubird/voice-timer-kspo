import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { AnnounceToggle } from '../components/AnnounceToggle'
import { useSessionStore } from '../store/sessionStore'
import { useSettingsStore, getVoiceProfileFromPack } from '../store/settingsStore'
import { primeSpeechFromUserGesture } from '../utils/sessionSpeechPrime'
import type { IntervalSettings } from '../types'

export default function IntervalPage() {
  const navigate = useNavigate()
  const audioPack = useSettingsStore((s) => s.audioPack)
  const [settings, setSettings] = useState<Omit<IntervalSettings, 'voiceProfile'>>({
    workSeconds: 30,
    restSeconds: 15,
    rounds: 5,
    announceMode: 'every10',
    vibration: true,
    sound: true,
  })

  const adjust = (field: 'workSeconds' | 'restSeconds' | 'rounds', delta: number) =>
    setSettings((p) => {
      const next = { ...p }
      const value = p[field] + delta
      if (field === 'rounds') {
        next[field] = Math.min(20, Math.max(1, value))
      } else {
        next[field] = Math.min(600, Math.max(5, value))
      }
      return next
    })

  return (
    <PageShell title="인터벌">
      <div className="space-y-6 text-[#111111]">
        <section className="space-y-3 rounded-[18px] border border-[#E8EAF0] bg-white p-4 shadow-sm">
          <IntervalRow
            label="운동"
            unit="초"
            value={settings.workSeconds}
            onDecrease={() => adjust('workSeconds', -5)}
            onIncrease={() => adjust('workSeconds', 5)}
          />
          <IntervalRow
            label="휴식"
            unit="초"
            value={settings.restSeconds}
            onDecrease={() => adjust('restSeconds', -5)}
            onIncrease={() => adjust('restSeconds', 5)}
          />
          <IntervalRow
            label="라운드"
            unit="회"
            value={settings.rounds}
            onDecrease={() => adjust('rounds', -1)}
            onIncrease={() => adjust('rounds', 1)}
          />
        </section>

        <div className="rounded-[18px] border border-[#E8EAF0] bg-white p-4 shadow-sm">
          <AnnounceToggle
            value={settings.announceMode}
            onChange={(announceMode) => setSettings((p) => ({ ...p, announceMode }))}
          />
        </div>

        <div className="pt-4">
          <button
            type="button"
            className="flex h-14 w-full items-center justify-center rounded-[14px] bg-gradient-to-r from-[#FF6A3D] to-[#FF8A3D] text-[17px] font-bold text-white shadow-lg shadow-[#FF6A3D]/28"
            onClick={() => {
              const cfg = { mode: 'interval' as const, settings: { ...settings, voiceProfile: getVoiceProfileFromPack(audioPack) } }
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

interface IntervalRowProps {
  label: string
  unit: string
  value: number
  onDecrease: () => void
  onIncrease: () => void
}

function IntervalRow({ label, unit, value, onDecrease, onIncrease }: IntervalRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[14px] border border-[#E8EAF0] bg-[#FAFBFC] px-4 py-3.5">
      <div className="text-sm font-semibold text-[#111111]">{label}</div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-full border border-[#E8EAF0] bg-white text-lg font-medium text-[#111111] shadow-sm"
          onClick={onDecrease}
          aria-label={`${label} 감소`}
        >
          −
        </button>
        <span className="min-w-[76px] text-center text-xl font-bold tabular-nums text-[#111111]">
          {value}
          <span className="ml-0.5 text-sm font-semibold text-[#7A7F8A]">{unit}</span>
        </span>
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-full border border-[#E8EAF0] bg-white text-lg font-medium text-[#111111] shadow-sm"
          onClick={onIncrease}
          aria-label={`${label} 증가`}
        >
          +
        </button>
      </div>
    </div>
  )
}
