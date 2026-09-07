import type { VoiceProfile } from '../types'

const isSupported = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window

export function buildUtterance(
  text: string,
  profile?: VoiceProfile,
  voice?: SpeechSynthesisVoice | null,
) {
  const utter = new SpeechSynthesisUtterance(text)
  void profile // pitch/rate 기본값을 고정하므로 profile은 현재 사용되지 않습니다.
  // 숫자는 한자음(육십, 십…)으로 읽히도록 BCP 47 ko-KR 고정
  utter.lang = 'ko-KR'
  // 기본 값(요청사항)
  utter.rate = 0.95
  utter.pitch = 1.0
  utter.volume = 1
  if (voice) utter.voice = voice
  // 브라우저 기본 콘솔 경고/에러 노이즈 완화 (실패는 조용히 무시)
  utter.onerror = () => {
    /* intentional no-op */
  }
  return utter
}

export function speakText(
  text: string,
  profile?: VoiceProfile,
  options?: { interrupt?: boolean; voice?: SpeechSynthesisVoice | null },
) {
  if (!isSupported()) return
  const { interrupt = true, voice } = options ?? {}
  try {
    const synth = window.speechSynthesis
    if (interrupt) synth.cancel()
    const utter = buildUtterance(text, profile, voice)
    synth.speak(utter)
  } catch {
    /* quiet — 명세: 음성 실패 시 에러 UI 금지 */
  }
}

export function stopSpeaking() {
  if (!isSupported()) return
  window.speechSynthesis.cancel()
}

