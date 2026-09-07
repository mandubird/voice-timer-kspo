/**
 * 앰비언트 오디오 생성 스크립트 (API 키 불필요 — 순수 수학적 합성)
 *
 * 사용법:
 *   node generate_ambient.cjs
 *
 * 출력:
 *   public/audio/ambient/singing_bowl.wav  — 싱잉볼 (시작/종료)
 *   public/audio/ambient/forest_wind.wav   — 숲 바람 루프 (명상 배경)
 *   public/audio/ambient/ocean_waves.wav   — 파도 루프 (보관용)
 *   public/audio/ambient/rain.wav          — 빗소리 루프 (수면 배경)
 */

'use strict'

const fs   = require('fs')
const path = require('path')

const SR = 44100  // 샘플레이트

/* ───────────────────────── WAV 파일 쓰기 ───────────────────────── */
function writeWav(filePath, samples) {
  const n      = samples.length
  const buf    = Buffer.alloc(44 + n * 2)
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + n * 2, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1,  20)   // PCM
  buf.writeUInt16LE(1,  22)   // mono
  buf.writeUInt32LE(SR, 24)
  buf.writeUInt32LE(SR * 2, 28)
  buf.writeUInt16LE(2,  32)
  buf.writeUInt16LE(16, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(n * 2, 40)
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2)
  }
  fs.writeFileSync(filePath, buf)
  const kb = Math.round(buf.length / 1024)
  console.log(`  ✓ ${path.basename(filePath).padEnd(22)} ${kb} KB`)
}

/* ─────────────────────────── 싱잉볼 ────────────────────────────── */
/**
 * 티베탄 싱잉볼 근사:
 *   - 기본음 432 Hz + 배음 3개 (각각 지수 감쇠)
 *   - 10ms 어택, 마지막 300ms 페이드아웃
 */
function generateSingingBowl(duration = 5.0) {
  const n = Math.round(SR * duration)
  const samples = new Float32Array(n)

  const partials = [
    { ratio: 1.000, amp: 0.65, decay: 5.0 },
    { ratio: 2.756, amp: 0.22, decay: 3.0 },
    { ratio: 5.404, amp: 0.09, decay: 1.8 },
    { ratio: 8.933, amp: 0.04, decay: 0.9 },
  ]
  const f0 = 432

  for (let i = 0; i < n; i++) {
    const t = i / SR
    let s = 0
    for (const p of partials) {
      s += p.amp * Math.exp(-t / p.decay) * Math.sin(2 * Math.PI * f0 * p.ratio * t)
    }
    const attack  = Math.min(1, t / 0.010)
    const fadeOut = Math.min(1, (duration - t) / 0.3)
    samples[i] = s * attack * fadeOut * 0.80
  }
  return samples
}

/* ──────────────────────────── 파도소리 ──────────────────────────── */
/**
 * 핑크 노이즈 (Paul Kellet 알고리즘) + 저주파 파도 리듬 변조.
 * 끝 15%를 처음 15%와 크로스페이드 → seamless loop.
 */
function generateOceanWaves(duration = 14.0) {
  const n = Math.round(SR * duration)
  const samples = new Float32Array(n)

  let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0

  for (let i = 0; i < n; i++) {
    const t = i / SR
    const w = Math.random() * 2 - 1
    b0 = 0.99886*b0 + w*0.0555179
    b1 = 0.99332*b1 + w*0.0750759
    b2 = 0.96900*b2 + w*0.1538520
    b3 = 0.86650*b3 + w*0.3104856
    b4 = 0.55000*b4 + w*0.5329522
    b5 = -0.7616*b5 - w*0.0168980
    const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w*0.5362
    b6 = w * 0.115926

    // 두 개의 파도 주기 겹치기
    const wave1 = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.11 * t)
    const wave2 = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.07 * t + 1.4)
    const env   = wave1 * 0.55 + wave2 * 0.45

    samples[i] = pink * 0.14 * env
  }

  // Seamless crossfade
  const fade = Math.floor(n * 0.15)
  for (let i = 0; i < fade; i++) {
    const a = i / fade
    samples[n - fade + i] = samples[n - fade + i] * a + samples[i] * (1 - a)
  }
  return samples
}

/* ─────────────────────── 바람 소리 (명상용) ──────────────────────── */
/**
 * 실제 바람 소리를 수학적으로 합성한다.
 *
 * 핵심 원리:
 *   ① 화이트 노이즈를 무거운 LP 필터(3-pole ~80 Hz)로 걸러 저음 기저(sub-bass) 생성
 *   ② 같은 노이즈를 2-pole ~400 Hz LP로 걸러 ①을 빼면 80–400 Hz 밴드패스 → "whoosh"
 *   ③ 4개의 서로소 주기 사인파(8–38 s)로 gust 엔벨로프를 만들어
 *      휘몰아치다 잦아드는 자연스러운 바람 강약 구현
 *
 * 60초 루프 + 끝 25%(15초) 크로스페이드 → 반복점이 거의 들리지 않음.
 */
function generateForestWind(duration = 60.0) {
  const n = Math.round(SR * duration)
  const out = new Float32Array(n)

  // ── 3-pole LP: 저음 기저 (effective cutoff ~80 Hz) ──────────────
  // 1-pole coeff ≈ 2π·157/44100 = 0.0223
  const KS = 0.022
  let s1=0, s2=0, s3=0

  // ── 2-pole LP: 바람 몸통 (effective cutoff ~400 Hz) ─────────────
  // 1-pole coeff ≈ 2π·620/44100 = 0.0884
  const KB = 0.088
  let b1=0, b2=0

  for (let i = 0; i < n; i++) {
    const t = i / SR
    const w = Math.random() * 2 - 1

    // ① Sub-bass: 3-pole LP (~80 Hz effective)
    s1 = s1*(1-KS) + w*KS
    s2 = s2*(1-KS) + s1*KS
    s3 = s3*(1-KS) + s2*KS

    // ② Wind body: 2-pole LP (~400 Hz) − sub = bandpass 80–400 Hz
    b1 = b1*(1-KB) + w*KB
    b2 = b2*(1-KB) + b1*KB
    const body = b2 - s3

    // ③ Gust envelope — 4개 주기가 서로소라 60 s 안에서 패턴이 반복되지 않음
    const gust =
      0.30 * (0.5 + 0.5 * Math.sin(2*Math.PI * t / 13.7))       // ~14 s
    + 0.25 * (0.5 + 0.5 * Math.sin(2*Math.PI * t /  8.3 + 1.9)) // ~ 8 s
    + 0.25 * (0.5 + 0.5 * Math.sin(2*Math.PI * t / 23.1 + 4.6)) // ~23 s
    + 0.20 * (0.5 + 0.5 * Math.sin(2*Math.PI * t / 37.9 + 2.8)) // ~38 s
    // gust 범위 ≈ 0.04 ~ 0.96

    // 저음 기저는 항상 존재 (은은한 공기압), 몸통은 gust에 따라 크게 변함
    out[i] = s3  * (0.45 + 0.55*gust) * 0.30
           + body * gust               * 0.70
  }

  // 정규화
  let peak = 0
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(out[i]))
  if (peak > 0) {
    const gain = 0.65 / peak
    for (let i = 0; i < n; i++) out[i] *= gain
  }

  // Seamless loop: 끝 25%(15 s)를 처음 25%와 크로스페이드
  const xf = Math.floor(n * 0.25)
  for (let i = 0; i < xf; i++) {
    const a = i / xf  // 0 → 1
    out[n-xf+i] = out[n-xf+i] * a + out[i] * (1-a)
  }

  return out
}

/* ────────────────────────── 빗소리 ──────────────────────────────── */
/**
 * 화이트+핑크 노이즈 혼합으로 자연스러운 빗소리 시뮬레이션.
 * seamless loop.
 */
function generateRain(duration = 14.0) {
  const n = Math.round(SR * duration)
  const samples = new Float32Array(n)

  let lp1 = 0, lp2 = 0, lp3 = 0
  // 가끔 떨어지는 빗방울 느낌의 미세 변동
  let dropPhase = 0

  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1

    // 저역 필터 3단계 (빗소리 특유의 부드러운 배경음)
    lp1 = lp1 * 0.97 + w * 0.03
    lp2 = lp2 * 0.85 + w * 0.15
    lp3 = lp3 * 0.60 + w * 0.40

    // 화이트 + 착색 노이즈 혼합
    const rain = w * 0.40 + lp2 * 0.35 + lp3 * 0.20 - lp1 * 0.15

    // 아주 느린 강도 변화 (0.02 Hz)
    dropPhase += 2 * Math.PI * 0.02 / SR
    const intensity = 0.88 + 0.12 * Math.sin(dropPhase)

    samples[i] = rain * 0.20 * intensity
  }

  // Seamless crossfade
  const fade = Math.floor(n * 0.10)
  for (let i = 0; i < fade; i++) {
    const a = i / fade
    samples[n - fade + i] = samples[n - fade + i] * a + samples[i] * (1 - a)
  }
  return samples
}

/* ────────────────────────── 메인 ──────────────────────────────── */
const outDir = path.join(__dirname, 'public', 'audio', 'ambient')
fs.mkdirSync(outDir, { recursive: true })

console.log('\nGenerating ambient audio files...\n')
writeWav(path.join(outDir, 'singing_bowl.wav'), generateSingingBowl(5.0))
writeWav(path.join(outDir, 'forest_wind.wav'),  generateForestWind(60.0))
writeWav(path.join(outDir, 'rain.wav'),          generateRain(14.0))
writeWav(path.join(outDir, 'ocean_waves.wav'),  generateOceanWaves(14.0))
console.log('\nDone! → public/audio/ambient/\n')
