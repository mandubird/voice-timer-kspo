import { useEffect, useRef, useCallback } from 'react'
import { getBrushingScripts } from '../data/brushingScripts'
import { useSessionStore } from '../store/sessionStore'
import { playOrSpeak } from '../utils/audioPlayer'
import { voiceFiles } from '../data/voiceFiles'

/**
 * elapsed(경과 초)를 감시하며 BRUSHING_SCRIPTS를 순차적으로 트리거.
 * 이미 재생한 스크립트는 Set에 기록해 중복 방지.
 * 버튼 제스처에서 이미 읽은 트리거는 `brushingSkipScriptTriggers`로 시드.
 */
export function useBrushingScript(
  elapsedSeconds: number,
  totalSeconds: 120 | 180,
  speak: (text: string, opts?: { interrupt?: boolean }) => void,
) {
  const getBrushMp3Base = useCallback(
    (triggerSeconds: number) => {
    // 2분(120): 0(start) / 20(top) / 50(bottom) / 80(left) / 110(right) / 120(end)
    if (totalSeconds === 120) {
      if (triggerSeconds === 0)   return voiceFiles.brush.start[0]
      if (triggerSeconds === 20)  return voiceFiles.brush.switch[0]  // brush_top_01
      if (triggerSeconds === 50)  return voiceFiles.brush.switch[1]  // brush_bottom_01
      if (triggerSeconds === 80)  return voiceFiles.brush.switch[2]  // brush_left_01
      if (triggerSeconds === 110) return voiceFiles.brush.switch[3]  // brush_right_01
      if (triggerSeconds === 120) return voiceFiles.brush.end[0]
    }

    // 3분(180): 0(start) / 20(top) / 80(bottom) / 135(left) / 160(right) / 180(end)
    // 50, 105는 WAV 없음 → '' 로 TTS 폴백
    if (triggerSeconds === 0)   return voiceFiles.brush.start[0]
    if (triggerSeconds === 20)  return voiceFiles.brush.switch[0]  // brush_top_01
    if (triggerSeconds === 50)  return ''                           // TTS 전용
    if (triggerSeconds === 80)  return voiceFiles.brush.switch[1]  // brush_bottom_01
    if (triggerSeconds === 105) return ''                           // TTS 전용
    if (triggerSeconds === 135) return voiceFiles.brush.switch[2]  // brush_left_01
    if (triggerSeconds === 160) return voiceFiles.brush.switch[3]  // brush_right_01
    if (triggerSeconds === 180) return voiceFiles.brush.end[0]

    return ''
    },
    [totalSeconds],
  )

  const skipKey = useSessionStore((s) => s.brushingSkipScriptTriggers.join(','))
  const fired = useRef<Set<number>>(new Set())

  useEffect(() => {
    const parsed =
      skipKey.length > 0
        ? skipKey.split(',').map((x) => Number(x)).filter((n) => !Number.isNaN(n))
        : []
    fired.current = new Set(parsed)
  }, [skipKey])

  useEffect(() => {
    if (elapsedSeconds < 0) return
    const scripts = getBrushingScripts(totalSeconds)
    for (const script of scripts) {
      if (
        script.triggerSeconds === elapsedSeconds &&
        !fired.current.has(script.triggerSeconds)
      ) {
        fired.current.add(script.triggerSeconds)
        const voiceBasename = getBrushMp3Base(script.triggerSeconds)
        // 코칭 문구는 cancel 없이 큐에 쌓기
        void playOrSpeak(voiceBasename, script.text, speak, { interrupt: false })
        break
      }
    }
  }, [elapsedSeconds, totalSeconds, speak, getBrushMp3Base])
}
