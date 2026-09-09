import { useEffect, useRef } from 'react'
import { Lock } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { TimerDisplay } from '../components/TimerDisplay'
import { useTimer } from '../hooks/useTimer'
import { useVoice } from '../hooks/useVoice'
import { useBrushingScript } from '../hooks/useBrushingScript'
import { useSessionFeedback } from '../hooks/useSessionFeedback'
import { useSessionStore } from '../store/sessionStore'
import { useSettingsStore } from '../store/settingsStore'
import { resumeAudioContext, playWhistle } from '../utils/soundEffects'
import { primeSpeechFromUserGesture } from '../utils/sessionSpeechPrime'
import { useWakeLock } from '../hooks/useWakeLock'
import { toKoreanCount } from '../utils/koreanNumbers'
import { playOrSpeak, playAudioFileToEnd, stopAllVoiceOutput } from '../utils/audioPlayer'
import { pickRandom, voiceFiles, numFiles } from '../data/voiceFiles'
import { showInterstitialAd } from '../utils/tossAds'
import { playSingingBowl } from '../utils/ambientPlayer'
import { useAmbientLoop } from '../hooks/useAmbientLoop'
import type { ActiveSessionConfig, IntervalPhase, MidVoiceSet } from '../types'

const MODE_LABEL: Record<string, string> = {
  countdown: '카운트다운',
  countup: '카운트업',
  interval: '인터벌',
  brushing: '양치 코치',
}

/** midVoiceSet → 세션 완료 시 표시 텍스트 */
const MID_VOICE_FINISH: Record<string, { emoji: string; msg: string }> = {
  meditation: { emoji: '🧘', msg: '명상을 마쳤어요. 수고하셨어요.' },
  sleep: { emoji: '🌙', msg: '잘 자요. 푹 쉬세요.' },
  asmr: { emoji: '🫧', msg: '이완되셨나요? 편안히 쉬세요.' },
}

export default function RunSessionPage() {
  const navigate = useNavigate()
  const config = useSessionStore((s) => s.config)
  const status = useSessionStore((s) => s.status)
  const countdownRemaining = useSessionStore((s) => s.countdownRemaining)
  const countupCount = useSessionStore((s) => s.countupCount)
  const countupCountdown = useSessionStore((s) => s.countupCountdown)
  const intervalRound = useSessionStore((s) => s.intervalRound)
  const intervalPhase = useSessionStore((s) => s.intervalPhase)
  const intervalRemaining = useSessionStore((s) => s.intervalRemaining)
  const brushingElapsed = useSessionStore((s) => s.brushingElapsed)
  const brushingRemaining = useSessionStore((s) => s.brushingRemaining)
  const tick = useSessionStore((s) => s.tick)
  const pause = useSessionStore((s) => s.pause)
  const resume = useSessionStore((s) => s.resume)
  const restart = useSessionStore((s) => s.restart)
  const clearSession = useSessionStore((s) => s.clearSession)

  useEffect(() => {
    if (!config) {
      navigate('/', { replace: true })
    }
  }, [config, navigate])

  useEffect(() => {
    if (config) void resumeAudioContext()
  }, [config])

  useTimer(tick, status === 'running' && !!config)

  useWakeLock(status === 'running')

  // 명상/수면 앰비언트 루프
  const midVoiceSetForAmbient =
    config?.mode === 'countdown' ? config.settings.midVoiceSet : undefined
  useAmbientLoop(midVoiceSetForAmbient as MidVoiceSet | undefined, status)

  useSessionFeedback({
    config,
    status,
    countdownRemaining,
    countupCount,
    intervalPhase,
    intervalRound,
    intervalRemaining,
    brushingElapsed,
  })

  const modeLabel = config ? MODE_LABEL[config.mode] ?? config.mode : ''
  const isRunning = status === 'running'
  const isFinished = status === 'finished'

  let mainValue: number | string = 0
  let unitLabel = '초'
  let subtitle: string | undefined

  if (config?.mode === 'countdown') {
    mainValue = countdownRemaining
    unitLabel = '초'
    subtitle = undefined
  } else if (config?.mode === 'countup') {
    mainValue = countupCount
    unitLabel = '회'
    subtitle = `다음까지 ${countupCountdown}초 · 목표 ${config.settings.maxCount}회`
  } else if (config?.mode === 'interval') {
    mainValue = intervalRemaining
    unitLabel = '초'
    const phaseKo = intervalPhase === 'work' ? '운동' : '휴식'
    subtitle = `${phaseKo} · 라운드 ${intervalRound} / ${config.settings.rounds}`
  } else if (config?.mode === 'brushing') {
    // brushing
    mainValue = brushingRemaining
    unitLabel = '초'
    subtitle = `남은 시간 약 ${brushingRemaining}초`
  }

  const audioPack = useSettingsStore((s) => s.audioPack)
  const isPro = useSettingsStore((s) => s.isPro)
  const openPaywall = useSettingsStore((s) => s.openPaywall)

  /** 직접 URL·스토어 조작 등으로 유료 세션이 열린 경우 차단 */
  useEffect(() => {
    if (!config || isPro) return
    if (config.mode === 'brushing') {
      clearSession()
      openPaywall('양치 코치')
      navigate('/', { replace: true })
      return
    }
    if (config.mode === 'countdown') {
      const m = config.settings.midVoiceSet
      if (m === 'sleep' || m === 'asmr') {
        clearSession()
        openPaywall('유료 기능입니다')
        navigate('/', { replace: true })
      }
    }
  }, [config, isPro, clearSession, navigate, openPaywall])

  const bgClass = getSessionVisualBackground(config?.mode, intervalPhase)

  const handleExit = () => {
    stopAllVoiceOutput()
    clearSession()
    navigate('/')
  }

  const voiceProfile = config ? config.settings.voiceProfile : undefined

  const voiceEnabled =
    (config?.mode === 'brushing' && config.settings.sound) ||
    config?.mode === 'countup' ||
    (config?.mode === 'countdown' && config.settings.sound) ||
    config?.mode === 'interval'

  const { speak } = useVoice(voiceProfile, {
    enabled: !!voiceEnabled,
  })

  // 양치 스크립트 음성
  useBrushingScript(
    config?.mode === 'brushing' ? brushingElapsed : -1,
    config?.mode === 'brushing' ? config.settings.durationSeconds : 120,
    (text, opts) => speak(text, opts),
  )

  // 인터벌: 페이즈/라운드 전환 + 마지막 5초 카운트 + 격려 멘트
  const prevIntervalPhaseRef = useRef<IntervalPhase | null>(null)
  const prevIntervalRoundRef = useRef<number | null>(null)
  const prevIntervalRemainingRef = useRef<number | null>(null)

  useEffect(() => {
    if (!config || config.mode !== 'interval' || status !== 'running') return

    const prevPhase = prevIntervalPhaseRef.current
    const prevRound = prevIntervalRoundRef.current
    const prevRem = prevIntervalRemainingRef.current

    // 첫 렌더 — ref만 초기화
    if (prevPhase === null || prevRound === null) {
      prevIntervalPhaseRef.current = intervalPhase
      prevIntervalRoundRef.current = intervalRound
      prevIntervalRemainingRef.current = intervalRemaining
      return
    }

    // 페이즈 또는 라운드 전환
    if (prevPhase !== intervalPhase || prevRound !== intervalRound) {
      if (intervalPhase === 'rest') {
        // 운동 → 휴식
        void playOrSpeak(
          pickRandom(voiceFiles.rest.start),
          '쉬는 시간이에요.',
          speak,
          { interrupt: false },
        )
      } else {
        // 휴식 → 운동: a("다음 라운드 시작합니다") 끝난 후 b("N라운드") → 휘슬
        // 무료 사용자(audioPack='none'): WAV 없음 → TTS 폴백
        const roundNum = intervalRound
        stopAllVoiceOutput()
        void (async () => {
          const okRound = await playAudioFileToEnd(voiceFiles.workout.round[0])
          if (!okRound) speak('다음 라운드 시작합니다', { interrupt: false })
          const okNum = await playAudioFileToEnd(`num_round_${roundNum}`)
          if (!okNum) speak(`${roundNum}라운드`, { interrupt: false })
          playWhistle()
        })()
      }
      prevIntervalPhaseRef.current = intervalPhase
      prevIntervalRoundRef.current = intervalRound
      prevIntervalRemainingRef.current = intervalRemaining
      return
    }

    // 구간 카운트다운 — announceMode 반영
    // push 격려 멘트가 같은 틱에 발화할 경우 숫자 카운트를 skip해 겹침 방지
    const rem = intervalRemaining
    const half = Math.floor(config.settings.workSeconds / 2)
    const pushWillFire =
      intervalPhase === 'work' && prevRem !== null && prevRem > half && rem <= half

    if (prevRem !== null && rem < prevRem && rem > 0 && !pushWillFire) {
      // 마지막 10초는 announceMode 무관 항상 카운트
      const shouldAnnounce = rem <= 10 || shouldAnnounceCountdownRemaining(rem, config.settings.announceMode)
      if (shouldAnnounce) {
        void playOrSpeak(numFiles.sino(rem), String(rem), speak, { interrupt: true })
      }
    }

    // 운동 구간 절반 격려 멘트 (Pro only)
    if (intervalPhase === 'work' && prevRem !== null) {
      if (prevRem > half && rem <= half) {
        const pushBasename = pickRandom(voiceFiles.workout.push)
        void playOrSpeak(
          pushBasename,
          '더 버텨봐요!',
          speak,
          { interrupt: false, proOnly: true },
        )
      }
    }

    prevIntervalRemainingRef.current = intervalRemaining
  }, [config, intervalPhase, intervalRound, intervalRemaining, status, speak])

  // 세션 완료: 인터벌 완료 음성 + 명상/수면 싱잉볼 + 무료 사용자 전면광고
  const prevStatusRef = useRef(status)
  useEffect(() => {
    const justFinished = prevStatusRef.current === 'running' && status === 'finished'
    if (justFinished) {
      if (config?.mode === 'interval') {
        void playOrSpeak(
          voiceFiles.common.done[0],
          '모두 완료! 수고하셨습니다',
          speak,
          { interrupt: false, proOnly: true },
        )
      }
      // 명상/수면 완료: 싱잉볼 + 완료 음성
      if (config?.mode === 'countdown') {
        const mvs = config.settings.midVoiceSet
        if (mvs === 'meditation' || mvs === 'sleep') {
          void playSingingBowl().then(() => {
            const endFiles = (voiceFiles[mvs] as { end: readonly string[] }).end
            const endFallback =
              mvs === 'meditation'
                ? '명상을 마쳤어요. 수고하셨어요.'
                : '잘 자요. 편안하게 쉬세요.'
            if (endFiles[0]) void playOrSpeak(endFiles[0], endFallback, speak, { interrupt: false })
          })
        }
      }
      // 무료 사용자: 1.5초 후 전면광고 (음성 멘트 재생 후)
      if (!isPro) {
        window.setTimeout(() => showInterstitialAd(), 1500)
      }
    }
    prevStatusRef.current = status
  }, [config, status, speak, isPro])

  // startScript는 primeSpeechFromUserGesture에서 Pro(WAV) + 무료(TTS) 모두 처리됨
  // → 여기서 중복 재생하지 않는다

  // 카운트다운: 남은 초를 숫자 문자열로 (ko-KR → 한자음 읽기)
  // + 명상/수면/ASMR 중간 음성 (midVoiceInterval마다 랜덤 재생)
  const prevCountdownSpeechRef = useRef<number | null>(null)
  useEffect(() => {
    if (!config || config.mode !== 'countdown' || status !== 'running') return
    if (!config.settings.sound) return
    const prev = prevCountdownSpeechRef.current
    prevCountdownSpeechRef.current = countdownRemaining
    if (prev === null) return
    if (countdownRemaining > prev) {
      prevCountdownSpeechRef.current = countdownRemaining
      return
    }
    if (countdownRemaining === prev) return
    const rem = countdownRemaining

    // 중간 음성 재생 (명상/수면/ASMR) — 수면·ASMR 클립은 Pro 전용
    const { midVoiceSet, midVoiceInterval, duration } = config.settings
    if (midVoiceSet && midVoiceInterval && rem > 0 && rem < duration) {
      if (rem % midVoiceInterval === 0) {
        const files = voiceFiles[midVoiceSet]?.mid as readonly string[] | undefined
        if (files) {
          const proMidOnly = midVoiceSet === 'sleep' || midVoiceSet === 'asmr'
          if (!proMidOnly || isPro) {
            void playOrSpeak(pickRandom(files), '', speak, { interrupt: false })
            return // 숫자 카운트와 겹치지 않도록 early return
          }
        }
      }
    }

    // midVoiceSet이 있으면 숫자 카운트 없음 (명상/수면/ASMR 분위기 유지)
    if (!midVoiceSet) {
      const half = Math.floor(config.settings.duration / 2)

      // 마지막 10초: announceMode 무관 항상 카운트 (10,9,8,...,1)
      if (rem <= 10) {
        void playOrSpeak(numFiles.sino(rem), String(rem), speak, { interrupt: true })
      } else if (shouldAnnounceCountdownRemaining(rem, config.settings.announceMode)) {
        // milestone이 숫자를 대체 → 겹침 없음
        if (rem === half && half > 10) {
          void playOrSpeak(pickRandom(voiceFiles.common.half), '딱 절반 남았어요', speak, { interrupt: true })
        } else {
          void playOrSpeak(numFiles.sino(rem), String(rem), speak, { interrupt: true })
        }
      }
    }
  }, [config, countdownRemaining, status, speak, isPro])

  // 카운트업 한국어 모드 음성
  const prevCountRef = useRef<number>(countupCount)
  useEffect(() => {
    if (!config || config.mode !== 'countup') {
      prevCountRef.current = countupCount
      return
    }
    if (config.settings.speakStyle !== 'korean') {
      prevCountRef.current = countupCount
      return
    }
    const prev = prevCountRef.current
    if (countupCount > prev && countupCount > 0) {
      const phrase = toKoreanCount(countupCount)
      void playOrSpeak(numFiles.native(countupCount), phrase, speak, { interrupt: true })
    }
    prevCountRef.current = countupCount
  }, [config, countupCount, speak])

  const handleRestart = () => {
    if (!config) return
    primeSpeechFromUserGesture(config)
    restart({
      ...(config.mode === 'brushing' && config.settings.sound
        ? { brushingSkipScriptTriggers: [0] }
        : {}),
      startPaused: true,
    })
    window.setTimeout(() => useSessionStore.getState().resume(), 2400)
  }
  const detailLine = config && !isFinished ? sessionDetailLine(config, audioPack) : null

  return (
    <div
      className={`relative flex min-h-dvh flex-col ${bgClass} transition-[background] duration-500`}
    >
      <header className="flex shrink-0 items-start justify-between px-4 pb-2 pt-4">
        <Link
          to="/"
          onClick={(e) => {
            e.preventDefault()
            handleExit()
          }}
          className="inline-flex min-h-11 min-w-[4.5rem] items-center text-sm font-medium text-[#7A7F8A]"
        >
          ← 나가기
        </Link>
        <div className="flex min-w-0 flex-1 flex-col items-center px-2 text-center">
          <span className="text-[13px] font-bold text-[#101828]">{modeLabel}</span>
          {detailLine ? (
            <span className="mt-0.5 line-clamp-2 text-[10px] font-medium leading-tight text-[#7A7F8A]">
              {detailLine}
            </span>
          ) : null}
        </div>
        <span className="min-w-[4.5rem]" aria-hidden />
      </header>

      <main className="flex min-h-0 flex-1 flex-col items-stretch px-4 pb-52 pt-2">
        {isFinished ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="text-6xl drop-shadow-sm" aria-hidden>
              {config?.mode === 'brushing'
                ? '✨'
                : config?.mode === 'countdown' && config.settings.midVoiceSet
                  ? MID_VOICE_FINISH[config.settings.midVoiceSet]?.emoji ?? '🎉'
                  : '🎉'}
            </p>
            <p className="mt-6 text-2xl font-extrabold text-[#101828]">완료!</p>
            <p className="mt-2 text-[15px] text-[#7A7F8A]">
              {config?.mode === 'brushing'
                ? '끝! 너무 잘했어!'
                : config?.mode === 'countdown' && config.settings.midVoiceSet
                  ? MID_VOICE_FINISH[config.settings.midVoiceSet]?.msg ?? '수고하셨습니다'
                  : '수고하셨습니다'}
            </p>
            {!isPro && (
              <button
                type="button"
                onClick={() => openPaywall('프리미엄 목소리')}
                className="mt-10 w-full rounded-2xl border border-[#E0E7FF] bg-white px-5 py-4 shadow-sm active:opacity-80"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF3FF]">
                    <Lock size={18} className="text-[#2F6BFF]" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[13px] font-semibold text-[#101828]">더 자연스러운 목소리로</p>
                    <p className="mt-0.5 text-[12px] text-[#7A7F8A]">프리미엄 목소리 · 광고 없음 · 2,970원</p>
                  </div>
                  <span className="rounded-full bg-[#2F6BFF] px-3 py-1.5 text-[12px] font-bold text-white">
                    시작하기
                  </span>
                </div>
              </button>
            )}
          </div>
        ) : (
          <>
            <TimerDisplay
              variant="session"
              value={mainValue}
              unitLabel={unitLabel}
              subtitle={subtitle}
              className="flex-1"
            />
            {/* 세션 중 하단 정보 */}
            <div className="mb-2 flex flex-col items-center gap-3">
              {/* 무료 사용자: Pro 힌트 */}
              {!isPro && (
                <button
                  type="button"
                  onClick={() => openPaywall('프리미엄 목소리')}
                  className="flex items-center gap-1.5 rounded-full border border-[#E0E7FF] bg-white/90 px-4 py-2 shadow-sm backdrop-blur-sm active:opacity-70"
                >
                  <Lock size={12} className="text-[#2F6BFF]" />
                  <span className="text-[12px] font-medium text-[#2F6BFF]">Pro 목소리 미리듣기</span>
                </button>
              )}
            </div>
          </>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E8EAF0] bg-white px-4 py-4">
        <div className="mx-auto flex max-w-lg flex-col gap-3">
          {!isFinished ? (
            <div className="flex gap-3">
              <button
                type="button"
                className="flex h-14 flex-1 items-center justify-center rounded-[14px] bg-[#F0F2F5] text-[16px] font-bold text-[#111111]"
                onClick={() => (isRunning ? pause() : resume())}
              >
                {isRunning ? '일시정지' : '재개'}
              </button>
              <button
                type="button"
                className="flex h-14 flex-1 items-center justify-center rounded-[14px] border border-[#E8EAF0] bg-white text-[16px] font-bold text-[#111111]"
                onClick={() => handleRestart()}
              >
                다시 시작
              </button>
            </div>
          ) : null}
          <button
            type="button"
            className="flex h-14 w-full items-center justify-center rounded-[14px] bg-[#2F6BFF] text-[16px] font-bold text-white shadow-lg shadow-[#2F6BFF]/25"
            onClick={handleExit}
          >
            {isFinished ? '홈으로' : '종료'}
          </button>
        </div>
      </footer>
    </div>
  )
}

function getSessionVisualBackground(
  mode: string | undefined,
  intervalPhase: IntervalPhase,
): string {
  if (mode === 'interval') {
    return intervalPhase === 'work'
      ? 'bg-[radial-gradient(ellipse_120%_90%_at_50%_-15%,rgba(255,106,61,0.16),transparent_58%)] bg-gradient-to-b from-[#FFF9F6] via-[#FAFAFA] to-[#EEEFF2]'
      : 'bg-[radial-gradient(ellipse_120%_90%_at_50%_-15%,rgba(76,175,80,0.13),transparent_58%)] bg-gradient-to-b from-[#F6FFF8] via-[#FAFAFA] to-[#EEEFF2]'
  }
  if (mode === 'brushing') {
    return 'bg-[radial-gradient(ellipse_100%_70%_at_50%_-5%,rgba(85,184,255,0.2),transparent_55%)] bg-gradient-to-b from-[#F2FBFF] to-[#E6F4FC]'
  }
  return 'bg-[radial-gradient(ellipse_100%_65%_at_50%_-5%,rgba(47,107,255,0.14),transparent_52%)] bg-gradient-to-b from-[#F8FBFF] to-[#E8EDF5]'
}

function voiceLabelFromPack(audioPack: string): string {
  if (audioPack === 'default') return '코치 보이스'
  if (audioPack === 'energy') return '에너지 코치'
  return '음성 안내'
}

function sessionDetailLine(cfg: ActiveSessionConfig, audioPack: string): string | null {
  if (cfg.mode === 'countdown') {
    const voice = voiceLabelFromPack(audioPack)
    if (cfg.settings.midVoiceSet) {
      const labels: Record<string, string> = {
        meditation: '호흡 안내 중',
        sleep: '수면 유도 중',
        asmr: 'ASMR 안내 중',
      }
      return `${labels[cfg.settings.midVoiceSet] ?? '안내 중'} · ${voice}`
    }
    const am =
      cfg.settings.announceMode === 'all'
        ? '매 초 안내 중'
        : cfg.settings.announceMode === 'every10'
          ? '10초마다 안내 중'
          : cfg.settings.announceMode === 'last10'
            ? '마지막 10초만 안내'
            : '마지막 5초만 안내'
    return `${am} · ${voice}`
  }
  if (cfg.mode === 'interval') {
    return voiceLabelFromPack(audioPack)
  }
  if (cfg.mode === 'brushing') {
    const v = voiceLabelFromPack(audioPack)
    return cfg.settings.sound ? `음성 안내 ON · ${v}` : '음성 OFF'
  }
  return null
}

function shouldAnnounceCountdownRemaining(
  rem: number,
  mode: 'all' | 'every10' | 'last5' | 'last10',
): boolean {
  if (rem <= 0) return false
  if (mode === 'all') return true
  if (mode === 'every10') return rem % 10 === 0
  if (mode === 'last10') return rem <= 10
  if (mode === 'last5') return rem <= 5
  return false
}
