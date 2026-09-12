import { create } from 'zustand'
import type { VoiceProfile } from '../types'

export type AudioPack = 'none' | 'default' | 'energy'

export function getVoiceProfileFromPack(audioPack: AudioPack): VoiceProfile {
  if (audioPack === 'energy') {
    return { id: 'premium-male', name: '프리미엄 남성 에너지', gender: 'male', tone: 'energy', language: 'ko-KR' }
  }
  if (audioPack === 'default') {
    return { id: 'premium-female', name: '프리미엄 여성 차분', gender: 'female', tone: 'calm', language: 'ko-KR' }
  }
  return { id: 'system', name: '기본 목소리', gender: 'female', tone: 'calm', language: 'ko-KR' }
}

interface SettingsStoreState {
  /** 향후 Pro / 사운드 등 연동 */
  soundEnabled: boolean
  setSoundEnabled: (v: boolean) => void
  /** 간단한 Pro 플래그 (실제 결제 연동은 v2) */
  isPro: boolean
  setPro: (v: boolean) => void

  /** 현재 선택된 음성 팩 폴더 */
  audioPack: AudioPack
  setAudioPack: (pack: AudioPack) => void

  /** PaywallModal 제어 전역 상태 */
  paywallOpen: boolean
  paywallFeature?: string
  openPaywall: (feature: string) => void
  closePaywall: () => void
}

function getInitialAudioPack(): AudioPack {
  // 무료 사용자는 항상 default — energy는 Pro 전용, none은 WKWebView에서 무음
  if (typeof window === 'undefined') return 'default'
  try {
    const isPro = window.localStorage.getItem('voice_timer_is_pro') === 'true'
    if (!isPro) return 'default'
    const saved = window.localStorage.getItem('voice_timer_audio_pack')
    if (saved === 'energy') return 'energy'
    return 'default'
  } catch {
    return 'default'
  }
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  soundEnabled: true,
  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
  // 공모전 심사용 배포본: 결제 팝업/잠금 기능/전면광고 없이 핵심 기능(맞춤 루틴·음성 코칭)을
  // 바로 시연할 수 있도록 Pro 상태로 고정한다. (실제 결제는 토스 앱 밖에서는 동작하지 않음 —
  // src/utils/tossProPayment.ts 참고. 원본 토스 미니앱에는 영향 없음 — 이 포크에서만 변경)
  isPro: true,
  audioPack: getInitialAudioPack(),
  setAudioPack: (audioPack) => {
    set({ audioPack })
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('voice_timer_audio_pack', audioPack)
      }
    } catch { /* ignore */ }
  },
  setPro: (isPro) => {
    const prev = get()
    const next: Partial<SettingsStoreState> = {
      isPro,
      paywallOpen: isPro ? false : prev.paywallOpen,
    }
    // Pro 전환 직후에도 녹음 음성·proOnly 경로가 동작하도록 기본 팩 부여
    if (isPro && prev.audioPack === 'none') {
      next.audioPack = 'default'
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('voice_timer_audio_pack', 'default')
        }
      } catch {
        /* ignore */
      }
    }
    set(next)
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('voice_timer_is_pro', String(isPro))
      }
    } catch {
      // ignore storage errors
    }
  },

  paywallOpen: false,
  paywallFeature: undefined,
  openPaywall: (feature) => {
    if (get().isPro) return
    set({ paywallOpen: true, paywallFeature: feature })
  },
  closePaywall: () => set({ paywallOpen: false, paywallFeature: undefined }),
}))
