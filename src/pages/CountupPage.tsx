import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { useSessionStore } from '../store/sessionStore'
import { useSettingsStore, getVoiceProfileFromPack } from '../store/settingsStore'
import { primeSpeechFromUserGesture } from '../utils/sessionSpeechPrime'
import type { CountupSettings } from '../types'

const chip = (on: boolean) =>
  on
    ? 'border-[#2F6BFF] bg-[#F3F7FF] text-[#2F6BFF] shadow-sm'
    : 'border-[#E8EAF0] bg-white text-[#111111] hover:border-[#D0D4E0]'

interface CountupPageProps {
  onRequirePro?: () => void
}

export default function CountupPage({ onRequirePro }: CountupPageProps) {
  const navigate = useNavigate()
  const isPro = useSettingsStore((s) => s.isPro)
  const audioPack = useSettingsStore((s) => s.audioPack)
  const [settings, setSettings] = useState<Omit<CountupSettings, 'voiceProfile'>>({
    maxCount: 20,
    intervalSeconds: 1,
    speakStyle: 'numeric',
  })

  return (
    <PageShell title="카운트업">
      <div className="space-y-6 text-[#111111]">
        <section className="rounded-[18px] border border-[#E8EAF0] bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[#111111]">최대 횟수</h2>
          <div className="mt-3 flex items-center justify-center gap-4">
            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-full border border-[#E8EAF0] bg-white text-xl font-medium shadow-sm"
              onClick={() =>
                setSettings((p) => ({
                  ...p,
                  maxCount: Math.max(1, p.maxCount - 1),
                }))
              }
              aria-label="횟수 감소"
            >
              −
            </button>
            <span className="min-w-[88px] text-center text-2xl font-extrabold tabular-nums">
              {settings.maxCount}
              <span className="text-lg font-bold text-[#7A7F8A]">회</span>
            </span>
            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-full border border-[#E8EAF0] bg-white text-xl font-medium shadow-sm"
              onClick={() =>
                setSettings((p) => ({
                  ...p,
                  maxCount: Math.min(200, p.maxCount + 1),
                }))
              }
              aria-label="횟수 증가"
            >
              +
            </button>
          </div>
        </section>

        <section className="rounded-[18px] border border-[#E8EAF0] bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[#111111]">간격</h2>
          <div className="mt-3 flex gap-2">
            {[1, 2].map((sec) => (
              <button
                key={sec}
                type="button"
                className={[
                  'min-h-12 flex-1 rounded-[14px] border px-3 py-3 text-sm font-semibold transition',
                  chip(settings.intervalSeconds === sec),
                ].join(' ')}
                onClick={() =>
                  setSettings((p) => ({ ...p, intervalSeconds: sec as 1 | 2 }))
                }
              >
                {sec}초 간격
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[18px] border border-[#E8EAF0] bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[#111111]">숫자 스타일</h2>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className={[
                'min-h-[4.5rem] flex-1 rounded-[14px] border px-2 py-3 text-sm font-medium leading-snug transition',
                chip(settings.speakStyle === 'numeric'),
              ].join(' ')}
              onClick={() =>
                setSettings((p) => ({ ...p, speakStyle: 'numeric' }))
              }
            >
              숫자
              <br />
              <span className="text-[11px] font-normal opacity-80">1, 2, 3…</span>
            </button>
            <button
              type="button"
              className={[
                'min-h-[4.5rem] flex-1 rounded-[14px] border px-2 py-3 text-sm font-medium leading-snug transition',
                chip(settings.speakStyle === 'korean'),
              ].join(' ')}
              onClick={() => {
                if (!isPro && onRequirePro) {
                  onRequirePro()
                  return
                }
                setSettings((p) => ({ ...p, speakStyle: 'korean' }))
              }}
            >
              한국어 ⭐
              <br />
              <span className="text-[11px] font-normal opacity-80">하나, 둘…</span>
            </button>
          </div>
          {!isPro ? (
            <p className="mt-2 text-xs leading-relaxed text-[#7A7F8A]">
              한국어 카운트 코치는 Pro에서 사용할 수 있어요.
            </p>
          ) : null}
        </section>

        <div className="pt-4">
          <button
            type="button"
            className="flex h-14 w-full items-center justify-center rounded-[14px] bg-gradient-to-r from-[#7A5CFA] to-[#9A7BFF] text-[17px] font-bold text-white shadow-lg shadow-[#7A5CFA]/30"
            onClick={() => {
              const cfg = { mode: 'countup' as const, settings: { ...settings, voiceProfile: getVoiceProfileFromPack(audioPack) } }
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
