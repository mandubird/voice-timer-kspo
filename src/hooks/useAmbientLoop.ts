/**
 * 명상/수면/ASMR 세션의 앰비언트 루프 관리 훅.
 *
 * - status === 'running' 이면 루프 시작 (최초 1회)
 * - status === 'paused'  이면 페이드아웃 → 정지
 * - status === 'finished' | 컴포넌트 언마운트 이면 즉시 정지
 */

import { useEffect, useRef } from 'react'
import type { MidVoiceSet } from '../types'
import { startAmbient, stopAmbient, stopAmbientImmediate } from '../utils/ambientPlayer'

type SessionStatus = 'idle' | 'running' | 'paused' | 'finished'

const TRACK_MAP: Partial<Record<MidVoiceSet, 'forest_wind' | 'ocean_waves' | 'rain'>> = {
  meditation: 'forest_wind',  // 잔잔한 숲 바람 (파도소리 → 교체)
  sleep:      'rain',
  // asmr: 앰비언트 없음 (음성 자체가 ASMR)
}

const VOLUME: Partial<Record<MidVoiceSet, number>> = {
  meditation: 0.18,  // 작게: 명상 음성과 충돌하지 않도록
  sleep:      0.22,
}

export function useAmbientLoop(
  midVoiceSet: MidVoiceSet | undefined,
  status: SessionStatus,
): void {
  const loopStarted = useRef(false)

  useEffect(() => {
    const track = midVoiceSet ? TRACK_MAP[midVoiceSet] : undefined
    if (!track) return

    if (status === 'running') {
      if (!loopStarted.current) {
        loopStarted.current = true
        startAmbient(track, { volume: VOLUME[midVoiceSet!] ?? 0.30, fadeIn: 3.0 })
      }
    } else if (status === 'paused') {
      loopStarted.current = false  // resume 시 재시작할 수 있도록 초기화
      stopAmbient({ fadeOut: 1.5 })
    } else if (status === 'finished') {
      loopStarted.current = false
      stopAmbientImmediate()
    }
  }, [midVoiceSet, status])

  // 컴포넌트 언마운트 시 즉시 정지
  useEffect(() => {
    return () => {
      stopAmbientImmediate()
    }
  }, [])
}
