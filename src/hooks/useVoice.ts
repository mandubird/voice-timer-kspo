import { useCallback, useEffect, useState } from 'react'
import type { VoiceProfile } from '../types'
import { useSettingsStore } from '../store/settingsStore'
import { speakText, stopSpeaking } from '../utils/speechUtils'

interface UseVoiceOptions {
  enabled?: boolean
}

function getKoreanVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return []
  return window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang && v.lang.toLowerCase().startsWith('ko'))
}

/**
 * voiceschanged가 오기 전엔 getVoices()가 비어있을 수 있어,
 * 이 함수는 "최대한 빨리" 호출하되 useVoice에서 voiceschanged 이벤트로 캐시 갱신한다.
 *
 * gender를 넘기면 목소리 이름에서 성별 키워드를 우선 필터링.
 * 해당 성별 목소리가 없으면 전체 목록에서 fallback.
 */
export function pickBestKoreanVoice(gender?: 'male' | 'female') {
  const voices = getKoreanVoices()
  if (voices.length === 0) return null

  // macOS 등에서 시리 브랜드 음성은 명시적으로 제외 (유료 팩용 TTS만 골라 쓸 때)
  const noSiri = voices.filter((v) => !/siri/i.test(v.name))
  const pool = noSiri.length > 0 ? noSiri : voices

  const femaleKeywords = ['yuna', 'sora', 'seoyeon', 'heami', 'female', 'woman', '여성']
  const maleKeywords = ['male', 'man', '남성', 'daniel', 'junho', 'jun']

  // gender에 맞는 목소리 필터
  let candidates = pool
  if (gender === 'female') {
    const filtered = pool.filter((v) =>
      femaleKeywords.some((k) => v.name.toLowerCase().includes(k)),
    )
    if (filtered.length > 0) candidates = filtered
  } else if (gender === 'male') {
    const filtered = pool.filter((v) =>
      maleKeywords.some((k) => v.name.toLowerCase().includes(k)),
    )
    if (filtered.length > 0) candidates = filtered
  }

  // 선호 이름 우선
  const preferredNames =
    gender === 'male'
      ? ['Daniel', 'Junho', 'Jun', 'Yuna', 'Sora']
      : ['Yuna', 'Sora', 'Seoyeon', 'Heami']

  for (const name of preferredNames) {
    const hit = candidates.find((v) => v.name.includes(name))
    if (hit) return hit
  }

  // 로컬 시스템 음성 우선
  const local = candidates.find((v) => v.localService)
  if (local) return local

  // fallback: candidates 첫 번째 → 전체 첫 번째
  return candidates[0] ?? pool[0] ?? null
}

/** utter.lang 은 `speechUtils.buildUtterance`에서 항상 `ko-KR`로 고정됩니다. */
export function useVoice(profile?: VoiceProfile | null, options?: UseVoiceOptions) {
  const audioPack = useSettingsStore((s) => s.audioPack)

  const [canSpeak] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return 'speechSynthesis' in window
  })

  const gender = profile?.gender

  /** 기본(무료) 플랜: utter.voice 미지정 → 브라우저/OS 기본 한국어 음성. Yuna·시리 강제 선택 방지 */
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)

  const enabled = options?.enabled ?? true

  useEffect(() => {
    if (!canSpeak) return

    const synth = window.speechSynthesis
    const update = () => {
      if (audioPack === 'none') {
        setSelectedVoice(null)
        return
      }
      setSelectedVoice(pickBestKoreanVoice(gender))
    }

    update()

    if (synth.onvoiceschanged !== undefined) {
      const prev = synth.onvoiceschanged
      synth.onvoiceschanged = () => {
        update()
      }
      return () => {
        synth.onvoiceschanged = prev
      }
    }

    return
  }, [canSpeak, gender, audioPack])

  const speak = useCallback(
    (text: string, opts?: { interrupt?: boolean }) => {
      if (!enabled || !canSpeak) return
      speakText(text, profile ?? undefined, {
        ...opts,
        voice: selectedVoice,
      })
    },
    [canSpeak, enabled, profile, selectedVoice],
  )

  const stop = useCallback(() => {
    if (!enabled || !canSpeak) return
    stopSpeaking()
  }, [canSpeak, enabled])

  return { canSpeak, speak, stop }
}

