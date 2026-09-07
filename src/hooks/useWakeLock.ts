import { useEffect, useRef } from 'react'

type WakeLockSentinel = {
  released: boolean
  release: () => Promise<void>
}

export function useWakeLock(active: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    let cancelled = false

    async function requestLock() {
      if (!active) return
      if (typeof navigator === 'undefined') return
      // 일부 브라우저에서 wakeLock 미지원
      const wakeLockApi = (navigator as unknown as { wakeLock?: { request?: (type: 'screen') => Promise<WakeLockSentinel> } }).wakeLock
      if (!wakeLockApi || typeof wakeLockApi.request !== 'function') return

      try {
        const sentinel: WakeLockSentinel = await wakeLockApi.request('screen')
        if (cancelled) {
          await sentinel.release().catch(() => {})
          return
        }
        sentinelRef.current = sentinel
      } catch {
        // 조용히 실패 (권한 거부 등)
      }
    }

    if (active && !sentinelRef.current) {
      void requestLock()
    }

    if (!active && sentinelRef.current) {
      sentinelRef.current
        .release()
        .catch(() => {})
        .finally(() => {
          sentinelRef.current = null
        })
    }

    return () => {
      cancelled = true
      if (sentinelRef.current) {
        sentinelRef.current
          .release()
          .catch(() => {})
          .finally(() => {
            sentinelRef.current = null
          })
      }
    }
  }, [active])
}

