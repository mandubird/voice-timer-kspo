/**
 * 앰비언트 오디오 플레이어 (루프 + 페이드인/아웃)
 *
 * AudioContext (decodeAudioData + BufferSourceNode + GainNode) 사용.
 * → iOS 무음(진동) 모드에서도 재생됨.
 */
import { getSharedAudioContext } from './soundEffects'

const AMBIENT_BASE = '/audio/ambient/'

type AmbientTrack = 'forest_wind' | 'ocean_waves' | 'rain'

interface StartOptions {
  volume?: number   // 0~1, default 0.35
  fadeIn?: number   // 초, default 2.0
}
interface StopOptions {
  fadeOut?: number  // 초, default 2.0
}

// 앰비언트 버퍼 캐시
const ambientCache = new Map<string, AudioBuffer>()

let loopSource: AudioBufferSourceNode | null = null
let loopGain: GainNode | null = null
let stopTimeout: ReturnType<typeof setTimeout> | null = null

function clearStopTimeout() {
  if (stopTimeout !== null) {
    clearTimeout(stopTimeout)
    stopTimeout = null
  }
}

async function fetchAmbientBuffer(ctx: AudioContext, path: string): Promise<AudioBuffer | null> {
  if (ambientCache.has(path)) return ambientCache.get(path)!
  try {
    const res = await fetch(path)
    if (!res.ok) return null
    const ab = await res.arrayBuffer()
    const buffer = await ctx.decodeAudioData(ab)
    ambientCache.set(path, buffer)
    return buffer
  } catch {
    return null
  }
}

/** 루프 트랙 시작 (이미 재생 중이면 교체) */
export async function startAmbient(track: AmbientTrack, opts: StartOptions = {}): Promise<void> {
  const { volume = 0.35, fadeIn = 2.0 } = opts

  stopAmbientImmediate()

  const ctx = getSharedAudioContext()
  if (!ctx) return
  if (ctx.state !== 'running') {
    try { await ctx.resume() } catch { return }
  }

  const path = `${AMBIENT_BASE}${track}.wav`
  const buffer = await fetchAmbientBuffer(ctx, path)
  if (!buffer) return

  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = true

  const gain = ctx.createGain()
  gain.gain.value = 0  // 페이드인 시작은 0

  source.connect(gain)
  gain.connect(ctx.destination)

  loopSource = source
  loopGain = gain

  source.start(0)

  // AudioContext 스케줄러로 부드러운 페이드인
  const t0 = ctx.currentTime
  gain.gain.setValueAtTime(0, t0)
  gain.gain.linearRampToValueAtTime(volume, t0 + Math.max(fadeIn, 0.01))
}

/** 루프 트랙 페이드아웃 후 정지 */
export function stopAmbient(opts: StopOptions = {}): void {
  const { fadeOut = 2.0 } = opts
  if (!loopSource || !loopGain) return

  clearStopTimeout()

  const ctx = getSharedAudioContext()
  const source = loopSource
  const gain = loopGain

  if (!ctx || fadeOut <= 0) {
    stopAmbientImmediate()
    return
  }

  // 현재 볼륨에서 0으로 페이드아웃
  const t0 = ctx.currentTime
  gain.gain.setValueAtTime(gain.gain.value, t0)
  gain.gain.linearRampToValueAtTime(0, t0 + fadeOut)

  loopSource = null
  loopGain = null

  stopTimeout = setTimeout(() => {
    try { source.stop() } catch { /* quiet */ }
    stopTimeout = null
  }, (fadeOut + 0.1) * 1000)
}

/** 즉시 정지 (fade 없이) */
export function stopAmbientImmediate(): void {
  clearStopTimeout()

  if (loopSource) {
    try { loopSource.stop() } catch { /* quiet */ }
    loopSource = null
  }
  loopGain = null
}

/** 싱잉볼 1회 재생 (루프와 독립적) */
export async function playSingingBowl(volume = 0.70): Promise<void> {
  const ctx = getSharedAudioContext()
  if (!ctx) return

  if (ctx.state !== 'running') {
    try { await ctx.resume() } catch { return }
  }

  const path = `${AMBIENT_BASE}singing_bowl.wav`
  const buffer = await fetchAmbientBuffer(ctx, path)
  if (!buffer) return

  return new Promise<void>((resolve) => {
    try {
      const source = ctx.createBufferSource()
      source.buffer = buffer

      const gain = ctx.createGain()
      gain.gain.value = volume
      source.connect(gain)
      gain.connect(ctx.destination)

      source.onended = () => resolve()
      source.start(0)
    } catch {
      resolve()
    }
  })
}
