import { getBrushingScripts } from '../data/brushingScripts'
import { voiceFiles, pickRandom } from '../data/voiceFiles'
import type { ActiveSessionConfig } from '../types'
import { playAudioFile, stopAllVoiceOutput } from './audioPlayer'
import { useSettingsStore } from '../store/settingsStore'
import { speakText } from './speechUtils'
import { pickBestKoreanVoice } from '../hooks/useVoice'
import { playWhistle, resumeAudioContext } from './soundEffects'
import { playSingingBowl } from './ambientPlayer'

/**
 * iOS Safari: Web Speech는 사용자 제스처 직후에 첫 speak가 있어야 함.
 * 모든 세션 진입·재시작 버튼에서 이 함수를 동기적으로 호출한다.
 *
 * 공통: common_start_01.wav 를 우선 재생하고, 실패 시에만 모드별 기존 TTS.
 */
export function primeSpeechFromUserGesture(config: ActiveSessionConfig) {
  const profile = config.settings.voiceProfile

  // iOS Safari: Web Audio API는 유저 제스처 안에서만 resume 가능
  void resumeAudioContext()
  stopAllVoiceOutput()

  // 명상·수면·ASMR: 싱잉볼 → (1.2초 후) 카테고리 시작 음성 + 휘슬 없음
  const midVoiceSet = config.mode === 'countdown' ? config.settings.midVoiceSet : undefined
  if (midVoiceSet) {
    const hasSingingBowl = midVoiceSet === 'meditation' || midVoiceSet === 'sleep'
    if (hasSingingBowl) {
      // 싱잉볼 재생 → 1.2초 후 시작 음성
      void playSingingBowl().then(() => {
        const categoryVoice = voiceFiles[midVoiceSet as keyof typeof voiceFiles] as
          | { start: readonly string[] }
          | undefined
        const startFile = categoryVoice?.start[0]
        if (startFile) void playAudioFile(startFile)
      })
    } else {
      // ASMR: 싱잉볼 없이 바로 시작 음성
      const categoryVoice = voiceFiles[midVoiceSet as keyof typeof voiceFiles] as
        | { start: readonly string[] }
        | undefined
      const startFile = categoryVoice?.start[0]
      if (startFile) void playAudioFile(startFile)
    }
    return
  }

  // 일반 세션: common_start + 휘슬
  const primeBasename = pickRandom(voiceFiles.common.start)

  const hasRecordedVoicePack = useSettingsStore.getState().audioPack !== 'none'
  const voice =
    hasRecordedVoicePack &&
    typeof window !== 'undefined' &&
    'speechSynthesis' in window
      ? pickBestKoreanVoice(profile.gender === 'male' ? 'male' : 'female')
      : null

  // 무료 사용자: iOS WKWebView에서 TTS는 반드시 사용자 제스처 컨텍스트에서
  // 한 번 이상 speak()가 호출되어야 이후 타이머 틱에서도 정상 작동한다.
  // 제스처 스택이 살아있는 지금(동기) 바로 unlock 시킴.
  if (!hasRecordedVoicePack && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    let startText = '시작'
    if (config.mode === 'countdown' && config.settings.startScript) {
      startText = config.settings.startScript
    } else if (config.mode === 'interval' && config.settings.startScript) {
      startText = config.settings.startScript
    }
    speakText(startText, profile, { interrupt: false, voice })
  }

  void playAudioFile(primeBasename).then((ok) => {
    // 시작 멘트 이후 1.8초 뒤 휘슬
    window.setTimeout(playWhistle, 1800)
    if (ok) return

    // 무료(팩 없음): 이미 위에서 TTS로 시작 멘트 처리됨
    if (!hasRecordedVoicePack) return

    switch (config.mode) {
      case 'countdown':
        if (config.settings.sound) {
          speakText(String(config.settings.duration), profile, { interrupt: true, voice })
        }
        break
      case 'countup':
        speakText('시작', profile, { interrupt: false, voice })
        break
      case 'interval':
        speakText('시작합니다', profile, { interrupt: false, voice })
        break
      case 'brushing':
        if (config.settings.sound) {
          const scripts = getBrushingScripts(config.settings.durationSeconds)
          speakText(scripts[0].text, profile, { interrupt: false, voice })
        }
        break
      default:
        break
    }
  })
}
