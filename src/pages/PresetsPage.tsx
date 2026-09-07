import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PresetCard } from '../components/PresetCard'
import { PageShell } from '../components/PageShell'
import { DEFAULT_PRESETS } from '../data/presets'
import { usePresetStore } from '../store/presetStore'
import { useSessionStore } from '../store/sessionStore'
import { useSettingsStore } from '../store/settingsStore'
import { useRecentStore } from '../store/recentStore'
import { presetToActiveSession } from '../types'
import { primeSpeechFromUserGesture } from '../utils/sessionSpeechPrime'
import { isProOnlyPresetCategory } from '../constants/proCategories'

const CATEGORY_TITLE: Record<string, string> = {
  workout: '운동',
  kitchen: '생활',
  brushing: '아이루틴',
  meditation: '명상',
  sleep: '수면 유도',
  asmr: 'ASMR',
}

export default function PresetsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const cat = searchParams.get('cat')

  const setHydrated = usePresetStore((s) => s.setHydrated)
  const isPro = useSettingsStore((s) => s.isPro)
  const openPaywall = useSettingsStore((s) => s.openPaywall)
  const addRecent = useRecentStore((s) => s.addRecent)

  useEffect(() => {
    setHydrated(true)
  }, [setHydrated])

  const handleStart = (id: string) => {
    const preset = DEFAULT_PRESETS.find((p) => p.id === id)
    if (!preset) return
    if (isProOnlyPresetCategory(preset.category) && !isPro) {
      openPaywall('유료 기능입니다')
      return
    }
    addRecent(id)
    const active = presetToActiveSession(preset)
    primeSpeechFromUserGesture(active)
    useSessionStore.getState().loadSession(active, {
      brushingSkipScriptTriggers:
        preset.mode === 'brushing' && preset.settings.sound ? [0] : [],
      startPaused: true,
    })
    navigate('/session')
    window.setTimeout(() => useSessionStore.getState().resume(), 2400)
  }

  const workoutPresets = DEFAULT_PRESETS.filter((p) => p.category === 'workout')
  const kitchenPresets = DEFAULT_PRESETS.filter((p) => p.category === 'kitchen')
  const brushingPresets = DEFAULT_PRESETS.filter((p) => p.category === 'brushing')
  const meditationPresets = DEFAULT_PRESETS.filter((p) => p.category === 'meditation')
  const sleepPresets = DEFAULT_PRESETS.filter((p) => p.category === 'sleep')
  const asmrPresets = DEFAULT_PRESETS.filter((p) => p.category === 'asmr')

  const pageTitle = cat ? (CATEGORY_TITLE[cat] ?? '타이머') : '전체'

  const showWorkout = !cat || cat === 'workout'
  const showKitchen = !cat || cat === 'kitchen'
  const showBrushing = !cat || cat === 'brushing'
  const showMeditation = !cat || cat === 'meditation'
  const showSleep = !cat || cat === 'sleep'
  const showAsmr = !cat || cat === 'asmr'

  return (
    <PageShell title={pageTitle} backLabel="홈">
      {showWorkout && (
        <section className="mt-6 space-y-3">
          {!cat && <h2 className="text-sm font-bold text-[#111111]">운동</h2>}
          <ul className="space-y-3" aria-label="운동 프리셋 목록">
            {workoutPresets.map((preset) => (
              <li key={preset.id}>
                <PresetCard
                  emoji={preset.emoji}
                  title={preset.title}
                  description={preset.description}
                  category={preset.category}
                  onClick={() => handleStart(preset.id)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {showKitchen && (
        <section className={`space-y-3 ${!cat ? 'mt-8' : 'mt-6'}`}>
          {!cat && <h2 className="text-sm font-bold text-[#111111]">생활</h2>}
          <ul className="space-y-3" aria-label="생활 프리셋 목록">
            {kitchenPresets.map((preset) => (
              <li key={preset.id}>
                <PresetCard
                  emoji={preset.emoji}
                  title={preset.title}
                  description={preset.description}
                  category={preset.category}
                  onClick={() => handleStart(preset.id)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {showBrushing && (
        <section className={`space-y-3 ${!cat ? 'mt-8' : 'mt-6'}`}>
          {!cat && <h2 className="text-sm font-bold text-[#111111]">양치/아이</h2>}
          <ul className="space-y-3" aria-label="양치 프리셋 목록">
            {brushingPresets.map((preset) => (
              <li key={preset.id}>
                <PresetCard
                  emoji={preset.emoji}
                  title={preset.title}
                  description={preset.description}
                  category={preset.category}
                  locked={!isPro}
                  onClick={() =>
                    isPro ? handleStart(preset.id) : openPaywall('유료 기능입니다')
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {showMeditation && (
        <section className={`space-y-3 ${!cat ? 'mt-8' : 'mt-6'}`}>
          {!cat && <h2 className="text-sm font-bold text-[#111111]">명상</h2>}
          <ul className="space-y-3" aria-label="명상 프리셋 목록">
            {meditationPresets.map((preset) => {
              const locked = !!preset.pro && !isPro
              return (
                <li key={preset.id}>
                  <PresetCard
                    emoji={preset.emoji}
                    title={preset.title}
                    description={preset.description}
                    category={preset.category}
                    locked={locked}
                    onClick={() => locked ? openPaywall('명상 Pro') : handleStart(preset.id)}
                  />
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {showSleep && (
        <section className={`space-y-3 ${!cat ? 'mt-8' : 'mt-6'}`}>
          {!cat && <h2 className="text-sm font-bold text-[#111111]">수면 유도</h2>}
          <ul className="space-y-3" aria-label="수면 프리셋 목록">
            {sleepPresets.map((preset) => (
              <li key={preset.id}>
                <PresetCard
                  emoji={preset.emoji}
                  title={preset.title}
                  description={preset.description}
                  category={preset.category}
                  locked={!isPro}
                  onClick={() =>
                    isPro ? handleStart(preset.id) : openPaywall('유료 기능입니다')
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {showAsmr && (
        <section className={`space-y-3 ${!cat ? 'mt-8' : 'mt-6'}`}>
          {!cat && <h2 className="text-sm font-bold text-[#111111]">ASMR</h2>}
          <ul className="space-y-3" aria-label="ASMR 프리셋 목록">
            {asmrPresets.map((preset) => (
              <li key={preset.id}>
                <PresetCard
                  emoji={preset.emoji}
                  title={preset.title}
                  description={preset.description}
                  category={preset.category}
                  locked={!isPro}
                  onClick={() =>
                    isPro ? handleStart(preset.id) : openPaywall('유료 기능입니다')
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </PageShell>
  )
}
