import { useEffect, useRef } from 'react'

/**
 * setInterval 기반 1초 틱 (명세 Step 3 / §13 useTimer)
 * 콜백 참조는 ref로 유지해 불필요한 인터벌 재시작을 줄입니다.
 */
export function useTimer(callback: () => void, active: boolean) {
  const saved = useRef(callback)
  useEffect(() => {
    saved.current = callback
  }, [callback])

  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => {
      saved.current()
    }, 1000)
    return () => window.clearInterval(id)
  }, [active])
}
