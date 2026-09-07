/**
 * 사전 녹음 음성 재생 (public/audio/{pack}/{basename}.wav).
 *
 * AudioContext (decodeAudioData + BufferSourceNode) 사용.
 * → HTMLAudioElement 와 달리 iOS 무음(진동) 모드에서도 재생됨.
 *
 * - stopAllVoiceOutput : TTS 중단 + 현재 소스 정지
 * - playAudioFile      : 로드/재생 실패 시 false (조용히 처리)
 * - playAudioFileToEnd : ended 이벤트까지 대기, 외부 중단 시 false
 * - playOrSpeak        : wav 우선 → 실패 시 TTS fallback
 */
import { useSettingsStore } from '../store/settingsStore'
import { getSharedAudioContext } from './soundEffects'

// 디코딩된 AudioBuffer 캐시 (경로 → 버퍼)
const audioCache = new Map<string, AudioBuffer>()

let currentSource: AudioBufferSourceNode | null = null
// playAudioFileToEnd 진행 중일 때 외부 중단을 알리는 콜백
let cancelCurrentPlayback: (() => void) | null = null

const PLAYBACK_RATE = 1.0

function normalizeBasename(filename: string): string {
  return filename.replace(/\.(wav|mp3)$/i, '').trim()
}

/** AudioContext를 가져오되 suspended면 resume 후 반환 */
async function getCtxReady(): Promise<AudioContext | null> {
  const ctx = getSharedAudioContext()
  if (!ctx) return null
  if (ctx.state === 'running') return ctx
  try {
    await ctx.resume()
    return ctx.state === 'running' ? ctx : null
  } catch {
    return null
  }
}

/** WAV 파일을 fetch → decodeAudioData → 캐시 */
async function fetchBuffer(ctx: AudioContext, path: string): Promise<AudioBuffer | null> {
  if (audioCache.has(path)) return audioCache.get(path)!
  try {
    const res = await fetch(path)
    if (!res.ok) return null
    const ab = await res.arrayBuffer()
    const buffer = await ctx.decodeAudioData(ab)
    audioCache.set(path, buffer)
    return buffer
  } catch {
    return null
  }
}

/**
 * 진행 중인 TTS·wav를 모두 중단한다.
 */
export function stopAllVoiceOutput(): void {
  if (typeof window === 'undefined') return

  if ('speechSynthesis' in window) {
    try {
      const ss = window.speechSynthesis
      if (ss.speaking || ss.pending) ss.cancel()
    } catch { /* quiet */ }
  }

  // playAudioFileToEnd 대기 중이면 cancelled 플래그 세팅
  if (cancelCurrentPlayback) {
    cancelCurrentPlayback()
    cancelCurrentPlayback = null
  }

  if (currentSource) {
    try { currentSource.stop() } catch { /* quiet */ }
    currentSource = null
  }
}

/**
 * wav 파일을 재생한다. 파일이 없거나 재생 실패 시 false를 반환한다.
 */
export async function playAudioFile(filename: string, pack?: string): Promise<boolean> {
  if (typeof window === 'undefined') return false

  const base = normalizeBasename(filename)
  if (!base) return false

  const folder = pack ?? useSettingsStore.getState().audioPack
  if (folder === 'none') return false

  const path = `/audio/${folder}/${base}.wav`

  const ctx = await getCtxReady()
  if (!ctx) return false

  const buffer = await fetchBuffer(ctx, path)
  if (!buffer) return false

  // 이전 소스 정지
  if (currentSource) {
    try { currentSource.stop() } catch { /* quiet */ }
    currentSource = null
  }

  try {
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.playbackRate.value = PLAYBACK_RATE
    source.connect(ctx.destination)

    currentSource = source
    source.onended = () => {
      if (currentSource === source) currentSource = null
    }

    source.start(0)
    return true
  } catch {
    return false
  }
}

/**
 * wav 파일을 재생하고 재생이 완전히 끝날 때까지(ended 이벤트) 기다린다.
 * 파일 없음·재생 실패 → false 즉시 반환.
 * stopAllVoiceOutput()에 의해 중단된 경우에도 false 반환.
 */
export async function playAudioFileToEnd(filename: string, pack?: string): Promise<boolean> {
  if (typeof window === 'undefined') return false

  const base = normalizeBasename(filename)
  if (!base) return false

  const folder = pack ?? useSettingsStore.getState().audioPack
  if (folder === 'none') return false

  const path = `/audio/${folder}/${base}.wav`

  const ctx = await getCtxReady()
  if (!ctx) return false

  const buffer = await fetchBuffer(ctx, path)
  if (!buffer) return false

  // 이전 소스 정지
  if (cancelCurrentPlayback) { cancelCurrentPlayback(); cancelCurrentPlayback = null }
  if (currentSource) {
    try { currentSource.stop() } catch { /* quiet */ }
    currentSource = null
  }

  return new Promise<boolean>((resolve) => {
    let settled = false
    let cancelled = false

    // stopAllVoiceOutput()이 이 재생을 중단할 수 있도록 등록
    cancelCurrentPlayback = () => { cancelled = true }

    const done = (result: boolean) => {
      if (settled) return
      settled = true
      cancelCurrentPlayback = null
      resolve(result)
    }

    const timeout = window.setTimeout(() => done(false), 10000)

    try {
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.playbackRate.value = PLAYBACK_RATE
      source.connect(ctx.destination)

      currentSource = source

      source.onended = () => {
        window.clearTimeout(timeout)
        if (currentSource === source) currentSource = null
        // 자연 종료 → true / 외부 중단 → false
        done(!cancelled)
      }

      source.start(0)
    } catch {
      window.clearTimeout(timeout)
      done(false)
    }
  })
}

/**
 * wav 우선 재생, 실패 시 TTS fallback.
 * proOnly: true면 무료 사용자(audioPack='none')일 때 wav·TTS 모두 건너뜀.
 */
export async function playOrSpeak(
  filename: string,
  fallbackText: string,
  speakFn: (text: string, opts?: { interrupt?: boolean }) => void,
  opts?: { interrupt?: boolean; proOnly?: boolean },
): Promise<void> {
  const { interrupt = true, proOnly = false } = opts ?? {}

  if (proOnly && useSettingsStore.getState().audioPack === 'none') return

  stopAllVoiceOutput()

  const ok = await playAudioFile(filename)
  if (ok) return

  speakFn(fallbackText, { interrupt })
}
