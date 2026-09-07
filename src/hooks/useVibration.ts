import { useCallback } from 'react'

/**
 * Vibration API 래퍼 — 미지원/에러 시 조용히 무시 (명세 특별 주의사항)
 */
export function useVibration() {
  const vibrate = useCallback((pattern: number | number[]) => {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
      return
    }
    try {
      navigator.vibrate(pattern)
    } catch {
      /* no-op */
    }
  }, [])

  return { vibrate }
}
