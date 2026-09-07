import { useEffect, useRef } from 'react'
import type { ActiveSessionConfig, IntervalPhase, SessionStatus } from '../types'
import {
  playIntervalCueBeep,
  playTickCrisp,
  playTickLight,
  playEndWhistle,
} from '../utils/soundEffects'
import { useVibration } from './useVibration'

interface UseSessionFeedbackArgs {
  config: ActiveSessionConfig | null
  status: SessionStatus
  countdownRemaining: number
  countupCount: number
  intervalPhase: IntervalPhase
  intervalRound: number
  intervalRemaining: number
  brushingElapsed: number
}

/**
 * Step 7 — 모드별 진동 + 효과음 (설정 플래그·알림 모드 반영)
 */
export function useSessionFeedback({
  config,
  status,
  countdownRemaining,
  countupCount,
  intervalPhase,
  intervalRound,
  intervalRemaining,
  brushingElapsed,
}: UseSessionFeedbackArgs) {
  const { vibrate } = useVibration()

  const prevStatus = useRef<SessionStatus>(status)
  const prevCountdown = useRef<number | null>(null)
  const prevCountup = useRef<number | null>(null)
  const prevPhase = useRef<IntervalPhase | null>(null)
  const prevRound = useRef<number | null>(null)
  const prevIntervalRem = useRef<number | null>(null)
  const prevElapsed = useRef<number | null>(null)

  useEffect(() => {
    if (!config) return

    const wasRunning = prevStatus.current === 'running'
    prevStatus.current = status

    if (wasRunning && status === 'finished') {
      if (config.mode === 'countdown') {
        if (config.settings.vibration) vibrate([160, 80, 160, 80, 200])
        if (config.settings.sound) playEndWhistle()
      } else if (config.mode === 'brushing') {
        vibrate([140, 70, 140, 70, 220])
        if (config.settings.sound) playEndWhistle()
      } else {
        vibrate([150, 80, 180])
        playEndWhistle()
      }
    }
  }, [config, status, vibrate])

  // 카운트다운: 매 초마다 항상 딱 소리 + 진동 (announceMode 무관)
  useEffect(() => {
    if (!config || config.mode !== 'countdown' || status !== 'running') return
    const { vibration, sound } = config.settings
    const prev = prevCountdown.current

    if (prev === null) {
      prevCountdown.current = countdownRemaining
      return
    }
    // 재시작 등으로 남은 시간이 갑자기 커지면 ref 동기화만
    if (countdownRemaining >= prev) {
      prevCountdown.current = countdownRemaining
      return
    }

    const rem = countdownRemaining
    if (rem <= 0) { prevCountdown.current = countdownRemaining; return }

    if (vibration) vibrate(35)
    if (sound) playTickCrisp()

    prevCountdown.current = countdownRemaining
  }, [config, countdownRemaining, status, vibrate])

  // 카운트업: 횟수가 올라갈 때마다 가벼운 피드백
  useEffect(() => {
    if (!config || config.mode !== 'countup' || status !== 'running') return
    const prev = prevCountup.current

    if (prev === null) {
      prevCountup.current = countupCount
      return
    }
    if (countupCount < prev) {
      prevCountup.current = countupCount
      return
    }
    if (countupCount > prev) {
      vibrate(28)
      playTickCrisp()
    }
    prevCountup.current = countupCount
  }, [config, countupCount, status, vibrate])

  // 인터벌: 운동↔휴식 전환 또는 라운드 변경 시
  useEffect(() => {
    if (!config || config.mode !== 'interval' || status !== 'running') return
    const p = prevPhase.current
    const r = prevRound.current

    if (p === null || r === null) {
      prevPhase.current = intervalPhase
      prevRound.current = intervalRound
      return
    }

    if (p !== intervalPhase || r !== intervalRound) {
      vibrate([45, 35, 45])
      playIntervalCueBeep()
    }
    prevPhase.current = intervalPhase
    prevRound.current = intervalRound
  }, [config, intervalPhase, intervalRound, status, vibrate])

  // 인터벌: 매 초 딱 소리 (phase 첫 틱 제외 — 전환음과 겹치지 않도록)
  useEffect(() => {
    if (!config || config.mode !== 'interval' || status !== 'running') return
    // sound는 optional (기본값 true)
    if (config.settings.sound === false) return

    const prev = prevIntervalRem.current
    const phaseChanged =
      prevPhase.current !== intervalPhase || prevRound.current !== intervalRound

    if (prev === null || phaseChanged) {
      prevIntervalRem.current = intervalRemaining
      return
    }
    if (intervalRemaining >= prev || intervalRemaining <= 0) {
      prevIntervalRem.current = intervalRemaining
      return
    }

    playTickLight()
    if (config.settings.vibration) vibrate(25)
    prevIntervalRem.current = intervalRemaining
  }, [config, intervalRemaining, intervalPhase, intervalRound, status, vibrate])

  // 양치: 매 초 틱 소리 + 스크립트 시점 진동
  useEffect(() => {
    if (!config || config.mode !== 'brushing' || status !== 'running') return
    const totalSeconds = config.settings.durationSeconds
    const prev = prevElapsed.current

    if (prev === null) {
      prevElapsed.current = brushingElapsed
      if (brushingElapsed === 0) vibrate(40)
      return
    }
    if (brushingElapsed < prev) {
      prevElapsed.current = brushingElapsed
      if (brushingElapsed === 0) vibrate(40)
      return
    }
    if (brushingElapsed === prev) return

    // 매 초 틱 소리
    if (config.settings.sound) playTickCrisp()

    // 마일스톤 진동
    const milestones =
      totalSeconds === 120
        ? [20, 50, 80, 110, totalSeconds]
        : [20, 50, 80, 105, 135, 160, totalSeconds]
    if (milestones.includes(brushingElapsed)) {
      vibrate(40)
    }
    prevElapsed.current = brushingElapsed
  }, [brushingElapsed, config, status, vibrate])
}
