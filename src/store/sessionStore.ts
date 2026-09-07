import { create } from 'zustand'
import type {
  ActiveSessionConfig,
  IntervalPhase,
  SessionStatus,
} from '../types'

export interface LoadSessionOptions {
  /** 제스처에서 이미 읽은 양치 스크립트 triggerSeconds (예: 0) */
  brushingSkipScriptTriggers?: number[]
  /** true면 status='paused'로 로드 — 외부에서 resume()으로 시작 (휘슬 후 타이머 시작용) */
  startPaused?: boolean
}

interface SessionStoreState {
  config: ActiveSessionConfig | null
  status: SessionStatus

  /** 양치: 버튼에서 이미 재생한 스크립트 초 — 훅에서 중복 방지 */
  brushingSkipScriptTriggers: number[]

  /** 카운트다운: 남은 초 */
  countdownRemaining: number

  /** 양치 모드: 전체 durationSeconds 기준 경과/잔여 */
  brushingElapsed: number
  brushingRemaining: number

  /** 카운트업: 현재까지 센 횟수, 다음 카운트까지 남은 초 */
  countupCount: number
  countupCountdown: number

  /** 인터벌 */
  intervalRound: number
  intervalPhase: IntervalPhase
  intervalRemaining: number

  /** 설정 로드 후 실행 대기(Step 3는 진입 시 자동 시작) */
  loadSession: (config: ActiveSessionConfig, options?: LoadSessionOptions) => void
  start: () => void
  pause: () => void
  resume: () => void
  /** 같은 설정으로 처음부터 (옵션으로 양치 0초 스크립트 스킵 등) */
  restart: (options?: LoadSessionOptions) => void
  /** 스토어 비우고 idle */
  clearSession: () => void
  /** 1초 틱 — running 일 때만 의미 있음 */
  tick: () => void
}

function initialRuntimeFromConfig(config: ActiveSessionConfig) {
  if (config.mode === 'countdown') {
    return {
      countdownRemaining: config.settings.duration,
      brushingElapsed: 0,
      brushingRemaining: 0,
      countupCount: 0,
      countupCountdown: 1,
      intervalRound: 1,
      intervalPhase: 'work' as IntervalPhase,
      intervalRemaining: 0,
    }
  }
  if (config.mode === 'countup') {
    return {
      countdownRemaining: 0,
      brushingElapsed: 0,
      brushingRemaining: 0,
      countupCount: 0,
      countupCountdown: config.settings.intervalSeconds,
      intervalRound: 1,
      intervalPhase: 'work' as IntervalPhase,
      intervalRemaining: 0,
    }
  }
  if (config.mode === 'interval') {
    return {
      countdownRemaining: 0,
      brushingElapsed: 0,
      brushingRemaining: 0,
      countupCount: 0,
      countupCountdown: 1,
      intervalRound: 1,
      intervalPhase: 'work' as IntervalPhase,
      intervalRemaining: config.settings.workSeconds,
    }
  }

  // brushing
  return {
    countdownRemaining: 0,
    brushingElapsed: 0,
    brushingRemaining: config.settings.durationSeconds,
    countupCount: 0,
    countupCountdown: 1,
    intervalRound: 1,
    intervalPhase: 'work' as IntervalPhase,
    intervalRemaining: 0,
  }
}

export const useSessionStore = create<SessionStoreState>((set, get) => ({
  config: null,
  status: 'idle',
  brushingSkipScriptTriggers: [],
  countdownRemaining: 0,
  brushingElapsed: 0,
  brushingRemaining: 0,
  countupCount: 0,
  countupCountdown: 1,
  intervalRound: 1,
  intervalPhase: 'work',
  intervalRemaining: 0,

  loadSession: (config, options) => {
    const rt = initialRuntimeFromConfig(config)
    set({
      config,
      status: options?.startPaused ? 'paused' : 'running',
      brushingSkipScriptTriggers: options?.brushingSkipScriptTriggers ?? [],
      ...rt,
    })
  },

  start: () => {
    const { config } = get()
    if (!config) return
    set({
      status: 'running',
      brushingSkipScriptTriggers: [],
      ...initialRuntimeFromConfig(config),
    })
  },

  pause: () => set({ status: 'paused' }),

  resume: () => {
    const { status } = get()
    if (status === 'finished' || status === 'idle') return
    set({ status: 'running' })
  },

  restart: (options) => {
    const { config } = get()
    if (!config) return
    set({
      status: options?.startPaused ? 'paused' : 'running',
      brushingSkipScriptTriggers: options?.brushingSkipScriptTriggers ?? [],
      ...initialRuntimeFromConfig(config),
    })
  },

  clearSession: () =>
    set({
      config: null,
      status: 'idle',
      brushingSkipScriptTriggers: [],
      countdownRemaining: 0,
      brushingElapsed: 0,
      brushingRemaining: 0,
      countupCount: 0,
      countupCountdown: 1,
      intervalRound: 1,
      intervalPhase: 'work',
      intervalRemaining: 0,
    }),

  tick: () => {
    const s = get()
    if (s.status !== 'running' || !s.config) return

    if (s.config.mode === 'countdown') {
      const next = s.countdownRemaining - 1
      if (next <= 0) {
        set({ countdownRemaining: 0, status: 'finished' })
        return
      }
      set({ countdownRemaining: next })
      return
    }

    if (s.config.mode === 'countup') {
      const { maxCount, intervalSeconds } = s.config.settings
      let count = s.countupCount
      let cd = s.countupCountdown - 1
      if (cd <= 0) {
        count += 1
        if (count >= maxCount) {
          set({ countupCount: count, status: 'finished' })
          return
        }
        cd = intervalSeconds
      }
      set({ countupCount: count, countupCountdown: cd })
      return
    }

    if (s.config.mode === 'interval') {
      const { restSeconds, workSeconds, rounds } = s.config.settings
      const rem = s.intervalRemaining - 1
      const round = s.intervalRound
      const phase = s.intervalPhase

      if (rem > 0) {
        set({ intervalRemaining: rem })
        return
      }

      // 구간 종료 → 전환
      if (phase === 'work') {
        set({
          intervalPhase: 'rest',
          intervalRemaining: restSeconds,
        })
        return
      }

      // rest 끝
      if (round >= rounds) {
        set({ intervalRemaining: 0, status: 'finished' })
        return
      }

      set({
        intervalRound: round + 1,
        intervalPhase: 'work',
        intervalRemaining: workSeconds,
      })
      return
    }

    // brushing: 2/3분 카운트다운 + 경과 시간 기록
    const nextRem = s.brushingRemaining - 1
    const nextElapsed = s.brushingElapsed + 1
    if (nextRem <= 0) {
      set({ brushingRemaining: 0, brushingElapsed: nextElapsed, status: 'finished' })
      return
    }
    set({ brushingRemaining: nextRem, brushingElapsed: nextElapsed })
  },
}))
