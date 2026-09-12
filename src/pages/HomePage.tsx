import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Timer, Dumbbell, ChevronRight, Lock } from 'lucide-react'
import { ModeCard } from '../components/ModeCard'
import { VoiceSelector } from '../components/VoiceSelector'
import { DEFAULT_PRESETS } from '../data/presets'
import { useSessionStore } from '../store/sessionStore'
import { useSettingsStore } from '../store/settingsStore'
import { useRecentStore } from '../store/recentStore'
import { presetToActiveSession } from '../types'
import { primeSpeechFromUserGesture } from '../utils/sessionSpeechPrime'
import { isProOnlyPresetCategory } from '../constants/proCategories'
import { attachBannerAd } from '../utils/tossAds'

const CATEGORIES = [
  {
    key: 'workout' as const,
    label: '운동',
    emoji: '🏋️',
    subtitle: '플랭크 · 스쿼트 · 버피 · 스트레칭',
    bg: 'bg-[#EAF1FF]',
    border: 'border-[#C5D9FF]/80',
    text: 'text-[#0F1F4D]',
    sub: 'text-[#4A5B7A]',
    pro: false,
  },
  {
    key: 'kitchen' as const,
    label: '생활',
    emoji: '🍜',
    subtitle: '라면 3분 · 주방 타이머',
    bg: 'bg-[#F0FFF4]',
    border: 'border-[#C6F6D5]/80',
    text: 'text-[#1A3D2B]',
    sub: 'text-[#3D6B50]',
    pro: false,
  },
  {
    key: 'brushing' as const,
    label: '아이루틴',
    emoji: '🦷',
    subtitle: '양치 2분 · 아이 양치 3분',
    bg: 'bg-[#EAF8FF]',
    border: 'border-[#B8E4FF]/80',
    text: 'text-[#0D3A52]',
    sub: 'text-[#3D5C70]',
    pro: true,
  },
  {
    key: 'meditation' as const,
    label: '명상',
    emoji: '🧘',
    subtitle: '1분 호흡 · 3분 · 5분',
    bg: 'bg-[#F3F0FF]',
    border: 'border-[#D9D0FF]/80',
    text: 'text-[#2A1A52]',
    sub: 'text-[#5A4A7A]',
    pro: false,
  },
  {
    key: 'sleep' as const,
    label: '수면 유도',
    emoji: '🌙',
    subtitle: '10분 · 20분 · 30분',
    bg: 'bg-[#F0F4FF]',
    border: 'border-[#C8D5FF]/80',
    text: 'text-[#0D1A40]',
    sub: 'text-[#3A4A70]',
    pro: true, // PRO_HIDDEN: Pro 전용
  },
  {
    key: 'asmr' as const,
    label: 'ASMR',
    emoji: '🫧',
    subtitle: '속삭임 호흡 · 감각 이완',
    bg: 'bg-[#F0FBF8]',
    border: 'border-[#B8EFE0]/80',
    text: 'text-[#0A2E22]',
    sub: 'text-[#2E6B55]',
    pro: true, // PRO_HIDDEN: Pro 전용
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const isPro = useSettingsStore((s) => s.isPro)
  const openPaywall = useSettingsStore((s) => s.openPaywall)
  const recentIds = useRecentStore((s) => s.recentIds)
  const addRecent = useRecentStore((s) => s.addRecent)

  const bannerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (isPro || !bannerRef.current) return
    return attachBannerAd(bannerRef.current)
  }, [isPro])

  const recentPresets = recentIds
    .map((id) => DEFAULT_PRESETS.find((p) => p.id === id))
    .filter(Boolean) as typeof DEFAULT_PRESETS

  const startPresetById = (presetId: string) => {
    const preset = DEFAULT_PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    if ((isProOnlyPresetCategory(preset.category) || preset.pro) && !isPro) {
      openPaywall('유료 기능입니다')
      return
    }
    addRecent(presetId)
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

  const goToCategory = (key: string, pro: boolean, paywallLabel: string) => {
    if (pro && !isPro) {
      openPaywall(paywallLabel)
      return
    }
    navigate(`/presets?cat=${key}`)
  }

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-lg flex-col bg-gradient-to-b from-[#F8FBFF] via-white to-[#F5F7FA] px-6 pb-32 pt-8">
      <header className="mb-8 text-left">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#7A7F8A]">
          Voice Coach Timer
        </p>
        <h1 className="mt-2 text-[1.65rem] font-extrabold leading-snug tracking-tight text-[#111111] sm:text-[1.85rem]">
          말하는 타이머
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#5C6370]">
          운동할 때 화면 안 봐도 되는 타이머
        </p>
      </header>

      {/* 국민체육진흥공단 공공데이터 연동 진입 배너 */}
      <section aria-label="국민체육진흥공단 공공데이터" className="mb-8 space-y-2">
        <div className="mb-3 flex items-center gap-1.5">
          <h2 className="text-xs font-semibold text-[#7A7F8A]">국민체육진흥공단 공공데이터 활용</h2>
          <span className="rounded-full bg-[#EEF3FF] px-1.5 py-0.5 text-[10px] font-bold text-[#2F6BFF]">
            공공데이터
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/fitness-goal')}
          className="flex w-full items-center gap-4 rounded-[18px] border border-[#C5D9FF]/80 bg-gradient-to-r from-[#EAF1FF] to-[#F3F0FF] p-4 text-left transition active:scale-[0.99]"
        >
          <span className="text-3xl" aria-hidden>🏅</span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-extrabold text-[#0F1F4D]">국민체력100 기반 맞춤 루틴</p>
            <p className="mt-0.5 text-[12px] text-[#4A5B7A]">연령대·성별 정보로 맞춤 운동 추천받기</p>
          </div>
          <ChevronRight className="size-5 shrink-0 text-black/25" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => navigate('/facilities')}
          className="flex w-full items-center gap-4 rounded-[18px] border border-[#C9E9D9]/80 bg-gradient-to-r from-[#EAFBF2] to-[#F3FBF0] p-4 text-left transition active:scale-[0.99]"
        >
          <span className="text-3xl" aria-hidden>📍</span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-extrabold text-[#0F4D2A]">주변 공공체육시설 찾기</p>
            <p className="mt-0.5 text-[12px] text-[#4A7A5C]">전국 공공체육시설 데이터에서 운동할 곳 찾기</p>
          </div>
          <ChevronRight className="size-5 shrink-0 text-black/25" strokeWidth={2} />
        </button>
      </section>

      {/* 최근 사용 */}
      {recentPresets.length > 0 && (
        <section aria-label="최근 사용" className="mb-8">
          <h2 className="mb-3 text-xs font-semibold text-[#7A7F8A]">최근 사용</h2>
          <div className="flex flex-col gap-2">
            {recentPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => startPresetById(preset.id)}
                className="flex items-center gap-3 rounded-[14px] border border-[#E8EAF0] bg-white px-4 py-3 text-left transition active:scale-[0.99] active:bg-[#F5F7FA]"
              >
                <span className="text-xl" aria-hidden>{preset.emoji ?? '⏱'}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold text-[#111111]">{preset.title}</p>
                  <p className="truncate text-[11px] text-[#7A7F8A]">{preset.description}</p>
                </div>
                <span className="shrink-0 text-[12px] font-semibold text-toss-blue">▶ 시작</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 카테고리 */}
      <section aria-label="카테고리" className="mb-8">
        <h2 className="mb-3 text-xs font-semibold text-[#7A7F8A]">카테고리</h2>
        <div className="flex flex-col gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => goToCategory(cat.key, cat.pro, cat.label)}
              className={[
                'flex items-center gap-4 rounded-[18px] border p-4 text-left transition active:scale-[0.99]',
                cat.bg,
                cat.border,
              ].join(' ')}
            >
              <span className="text-3xl" aria-hidden>{cat.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={`text-[16px] font-extrabold ${cat.text}`}>{cat.label}</p>
                  {cat.pro && !isPro && (
                    <span className="flex items-center gap-1 rounded-full bg-[#FFF4E5] px-2 py-0.5 text-[10px] font-bold text-[#C45C00] ring-1 ring-[#FFD4A8]">
                      <Lock className="size-2.5" strokeWidth={2.5} />
                      Pro
                    </span>
                  )}
                </div>
                <p className={`mt-0.5 text-[12px] ${cat.sub}`}>{cat.subtitle}</p>
              </div>
              <ChevronRight className="size-5 shrink-0 text-black/25" strokeWidth={2} />
            </button>
          ))}
        </div>
      </section>

      {/* 직접 설정 */}
      <section aria-label="직접 설정" className="mb-8">
        <h2 className="mb-3 text-xs font-semibold text-[#7A7F8A]">직접 설정</h2>
        <nav className="flex flex-col gap-3" aria-label="타이머 모드 선택">
          <ModeCard
            to="/countdown"
            title="카운트다운"
            description="남은 시간을 음성으로 안내"
            icon={Timer}
            visual="countdown"
          />
          <ModeCard
            to="/interval"
            title="인터벌"
            description="운동 · 휴식 구간을 코치"
            icon={Dumbbell}
            visual="interval"
          />
        </nav>
      </section>

      {/* 음성 톤 */}
      <section>
        <VoiceSelector />
      </section>

      {/* 하단 링크 */}
      <div className="pt-4 pb-4 flex justify-center gap-4 text-[12px] text-[#BBBBBB]">
        <a href="/privacy" className="hover:text-[#888]">개인정보처리방침</a>
        <span>·</span>
        <a href="mailto:eunhaebleu@naver.com" className="hover:text-[#888]">문의하기</a>
      </div>

      {/* 배너 광고 (무료 사용자) */}
      {!isPro && <div ref={bannerRef} className="w-full pb-4" />}
    </div>
  )
}
