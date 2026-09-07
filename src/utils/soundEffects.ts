let sharedCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (sharedCtx) return sharedCtx
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    sharedCtx = new AC()
    return sharedCtx
  } catch {
    return null
  }
}

/** audioPlayer / ambientPlayer 에서 공유 AudioContext를 사용하기 위해 export */
export function getSharedAudioContext(): AudioContext | null {
  return getAudioContext()
}

/**
 * AudioContext 상태에 관계없이 안전하게 콜백을 실행한다.
 * - 'running'이면 즉시 실행
 * - 'suspended'이면 resume() 후 실행 (Promise 기반으로 await 처리)
 * - 실패 시 조용히 무시
 *
 * WKWebView 주의: HTMLAudioElement 재생 직후 AudioContext가 'suspended'로 전환될 수 있다.
 * 기존 코드는 `void ctx.resume()`만 하고 즉시 오실레이터를 생성해 소리가 안 나는 버그가 있었다.
 */
function withCtx(fn: (ctx: AudioContext) => void): void {
  const ctx = getAudioContext()
  if (!ctx) return
  if (ctx.state === 'running') {
    try { fn(ctx) } catch { /* quiet */ }
    return
  }
  // suspended / interrupted → resume 후 재생
  ctx.resume()
    .then(() => { try { fn(ctx) } catch { /* quiet */ } })
    .catch(() => { /* quiet */ })
}

/**
 * 사용자 제스처 이후 첫 재생 전 호출 권장 (모바일 자동재생 정책)
 * iOS 무음 스위치 우회: 빈 <audio> 요소를 재생해 AudioContext를 미디어 채널로 전환
 */
export function resumeAudioContext(): Promise<void> {
  const ctx = getAudioContext()
  if (!ctx || ctx.state !== 'suspended') return Promise.resolve()
  return ctx.resume().catch(() => { /* quiet */ })
}

/** 카운트다운 매초 틱 (아주 작게) */
export function playSoftBeep() {
  withCtx((ctx) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.value = 0.045
    osc.connect(gain)
    gain.connect(ctx.destination)
    const t0 = ctx.currentTime
    gain.gain.setValueAtTime(0.045, t0)
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.04)
    osc.start(t0)
    osc.stop(t0 + 0.04)
  })
}

/** 카운트업 횟수 "딱" — 짧고 선명한 클릭 */
export function playTickCrisp() {
  withCtx((ctx) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 1200
    osc.connect(gain)
    gain.connect(ctx.destination)
    const t0 = ctx.currentTime
    gain.gain.setValueAtTime(0, t0)
    gain.gain.linearRampToValueAtTime(0.18, t0 + 0.003)
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.025)
    osc.start(t0)
    osc.stop(t0 + 0.03)
  })
}

/** 인터벌 매 초 "딱" 소리 — 카운트업보다 조금 작게 */
export function playTickLight() {
  withCtx((ctx) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 1000
    osc.connect(gain)
    gain.connect(ctx.destination)
    const t0 = ctx.currentTime
    gain.gain.setValueAtTime(0, t0)
    gain.gain.linearRampToValueAtTime(0.09, t0 + 0.003)
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.022)
    osc.start(t0)
    osc.stop(t0 + 0.025)
  })
}

/** 구간 전환용 약간 낮은 톤 */
export function playIntervalCueBeep() {
  withCtx((ctx) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 520
    gain.gain.value = 0.07
    osc.connect(gain)
    gain.connect(ctx.destination)
    const t0 = ctx.currentTime
    const dur = 0.07
    gain.gain.setValueAtTime(0.07, t0)
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur)
    osc.start(t0)
    osc.stop(t0 + dur)
  })
}

/** 세션 완료 — 선명하고 경쾌한 또깍 두 번 */
export function playSuccessChime() {
  withCtx((ctx) => {
    const tap = (freq: number, startSec: number, gainPeak: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.setValueAtTime(0, startSec)
      gain.gain.linearRampToValueAtTime(gainPeak, startSec + 0.004)
      gain.gain.exponentialRampToValueAtTime(0.001, startSec + 0.06)
      osc.start(startSec)
      osc.stop(startSec + 0.07)
    }
    const t0 = ctx.currentTime
    tap(880, t0, 0.18)
    tap(1320, t0 + 0.09, 0.22)
  })
}

/** 종료 신호 — 내려가는 세 박자 */
export function playEndWhistle() {
  withCtx((ctx) => {
    const tap = (freq: number, startSec: number, peak: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.setValueAtTime(0, startSec)
      gain.gain.linearRampToValueAtTime(peak, startSec + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.001, startSec + 0.22)
      osc.start(startSec)
      osc.stop(startSec + 0.25)
    }
    const t0 = ctx.currentTime
    tap(1400, t0, 0.32)
    tap(1050, t0 + 0.22, 0.28)
    tap(700,  t0 + 0.44, 0.24)
  })
}

/** 시작 신호 휘슬 — 짧고 선명한 고음 스윕 */
export function playWhistle() {
  withCtx((ctx) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.connect(gain)
    gain.connect(ctx.destination)
    const t0 = ctx.currentTime
    osc.frequency.setValueAtTime(2200, t0)
    osc.frequency.linearRampToValueAtTime(2900, t0 + 0.07)
    osc.frequency.linearRampToValueAtTime(2500, t0 + 0.35)
    gain.gain.setValueAtTime(0, t0)
    gain.gain.linearRampToValueAtTime(0.55, t0 + 0.02)
    gain.gain.setValueAtTime(0.50, t0 + 0.28)
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.45)
    osc.start(t0)
    osc.stop(t0 + 0.5)
  })
}
