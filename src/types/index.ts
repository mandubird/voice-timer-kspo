/** 세션·설정에서 공통으로 쓰는 모드 구분 (명세 §4) */
export type TimerMode = 'countdown' | 'countup' | 'interval' | 'brushing'

export type SessionStatus = 'idle' | 'running' | 'paused' | 'finished'

// 명세 §4 데이터 모델을 기반으로 한 타입들

export interface VoiceProfile {
  id: string
  name: string
  gender: 'male' | 'female'
  tone: 'calm' | 'energy'
  language: 'ko-KR'
}

export type AnnounceMode = 'all' | 'every10' | 'last5' | 'last10'

export interface CountdownSettings {
  duration: number // 초 단위
  announceMode: AnnounceMode
  voiceProfile: VoiceProfile
  vibration: boolean
  sound: boolean
  /** 타이머 시작 시 재생할 음성 멘트 (예: "라면을 끓여볼까요?") */
  startScript?: string
  /** 중간에 주기적으로 재생할 음성 세트 (명상/수면/ASMR) */
  midVoiceSet?: MidVoiceSet
  /** midVoiceSet 재생 간격 (초 단위, 예: 120 = 2분마다) */
  midVoiceInterval?: number
}

export interface CountupSettings {
  maxCount: number
  intervalSeconds: 1 | 2
  speakStyle: 'numeric' | 'korean'
  voiceProfile: VoiceProfile
}

export interface IntervalSettings {
  workSeconds: number
  restSeconds: number
  rounds: number
  announceMode: AnnounceMode
  voiceProfile: VoiceProfile
  /** 인터벌 틱 소리 여부 (UI는 v1에서 생략 가능) */
  sound?: boolean
  /** 인터벌 틱 진동 여부 (UI는 v1에서 생략 가능) */
  vibration?: boolean
  /** 타이머 시작 시 재생할 음성 멘트 (무료 사용자 TTS) */
  startScript?: string
}

export interface BrushingSettings {
  voiceProfile: VoiceProfile
  sound: boolean
  durationSeconds: 120 | 180
}

export interface BrushingScript {
  triggerSeconds: number
  text: string
}

/** 설정 화면 → 세션으로 넘길 때 사용하는 판별 유니온 */
export type ActiveSessionConfig =
  | { mode: 'countdown'; settings: CountdownSettings }
  | { mode: 'countup'; settings: CountupSettings }
  | { mode: 'interval'; settings: IntervalSettings }
  | { mode: 'brushing'; settings: BrushingSettings }

export type IntervalPhase = 'work' | 'rest'

export type PresetCategory = 'workout' | 'kitchen' | 'brushing' | 'meditation' | 'sleep' | 'asmr' | 'custom'

/** 카운트다운 중간에 주기적으로 재생할 음성 세트 */
export type MidVoiceSet = 'meditation' | 'sleep' | 'asmr'

interface PresetBase {
  id: string
  title: string
  description: string
  category: PresetCategory
  emoji?: string
  /** Pro 전용 프리셋 (카테고리 전체가 아닌 개별 잠금) */
  pro?: boolean
}

/** 명세 §3.3 — 모드별 settings가 일치하는 판별 유니온 */
export type Preset =
  | (PresetBase & { mode: 'countdown'; settings: CountdownSettings })
  | (PresetBase & { mode: 'countup'; settings: CountupSettings })
  | (PresetBase & { mode: 'interval'; settings: IntervalSettings })
  | (PresetBase & { mode: 'brushing'; settings: BrushingSettings })

export function presetToActiveSession(preset: Preset): ActiveSessionConfig {
  switch (preset.mode) {
    case 'countdown':
      return { mode: 'countdown', settings: preset.settings }
    case 'countup':
      return { mode: 'countup', settings: preset.settings }
    case 'interval':
      return { mode: 'interval', settings: preset.settings }
    case 'brushing':
      return { mode: 'brushing', settings: preset.settings }
  }
}
