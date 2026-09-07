/**
 * Gemini 2.5 Flash TTS - 음성 파일 생성 스크립트
 *
 * 사용법:
 *   export GOOGLE_API_KEY="your_api_key"
 *   node generate_audio.cjs [voice]
 *
 *   voice 옵션: default(기본) | energy | calm | kids
 *   예: node generate_audio.cjs energy
 *
 * 폴더 구조:
 *   public/audio/default/  ← 무료 기본 목소리 (Laomedeia)
 *   public/audio/energy/   ← 유료 에너지 톤 (Rasalgethi)
 *   public/audio/calm/     ← 유료 차분한 톤 (TBD)
 *   public/audio/kids/     ← 유료 아이용 톤 (TBD)
 */

const https = require('https')
const fs = require('fs')
const path = require('path')

// 멀티 API 키 지원: GOOGLE_API_KEY_1, GOOGLE_API_KEY_2, ... 또는 GOOGLE_API_KEY
const API_KEYS = (() => {
  const keys = []
  for (let i = 1; i <= 10; i++) {
    const k = process.env[`GOOGLE_API_KEY_${i}`]
    if (k) keys.push(k)
  }
  if (keys.length === 0 && process.env.GOOGLE_API_KEY) keys.push(process.env.GOOGLE_API_KEY)
  return keys
})()
let currentKeyIndex = 0
const API_KEY = API_KEYS[0]   // 하위 호환용 (단일 키 참조 코드에서 사용)

const MODEL = 'gemini-2.5-flash-preview-tts'

// 목소리 설정
const VOICE_CONFIG = {
  default: { voice: 'Laomedeia', label: '기본 목소리 (무료)' },
  energy:  { voice: 'Rasalgethi', label: '에너지 톤 (유료)' },
  calm:    { voice: 'Laomedeia', label: '차분한 톤 (유료) — 목소리 미정' },
  kids:    { voice: 'Laomedeia', label: '아이용 톤 (유료) — 목소리 미정' },
}

const TARGET_VOICE = process.argv[2] || 'default'
const TARGET_MODE = process.argv[3] || 'main'   // main | numbers | priority | all | select
// select 모드: process.argv[4] 에 콤마 구분 파일명 목록
const SELECT_NAMES = TARGET_MODE === 'select' && process.argv[4]
  ? new Set(process.argv[4].split(',').map(s => s.trim()).filter(Boolean))
  : null
const config = VOICE_CONFIG[TARGET_VOICE]

if (!config) {
  console.error(`❌ 알 수 없는 목소리: ${TARGET_VOICE}`)
  console.error('   사용 가능: default | energy | calm | kids')
  process.exit(1)
}

if (!['main', 'numbers', 'priority', 'all', 'fix', 'select'].includes(TARGET_MODE)) {
  console.error(`❌ 알 수 없는 모드: ${TARGET_MODE}`)
  console.error('   사용 가능: main | numbers | priority | all | fix | select')
  process.exit(1)
}

if (API_KEYS.length === 0) {
  console.error('❌ API 키가 없습니다. 다음 중 하나를 설정하세요:')
  console.error('   export GOOGLE_API_KEY="키1"                      # 단일 키')
  console.error('   export GOOGLE_API_KEY_1="키1" GOOGLE_API_KEY_2="키2"  # 멀티 키')
  process.exit(1)
}

const OUTPUT_DIR = path.join(__dirname, 'public', 'audio', TARGET_VOICE)
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true })

// 카테고리별 프롬프트
const PROMPTS = {
  common:          'Speak in a warm, welcoming tone:',
  workout:         'Speak in a clear, encouraging tone with steady energy. Pronounce each syllable fully, do not rush:',
  rest:            'Speak in a calm, soothing tone:',
  brush:           'Speak in a cheerful, friendly tone like talking to a young child:',
  reaction:        'Speak in a warm, encouraging tone:',
  number:          'Read aloud this Korean number naturally:',
  meditation:      '', // SSML 사용 — prosody 태그로 톤/속도 제어 (prompt 불필요)
  sleep:           '', // SSML 사용 — 수면 유도, 느린 속도 + 긴 침묵
  asmr:            '', // SSML 사용 — ASMR 속삭임 톤
}

// 33개 파일 목록 (파일명 확정본)
const files = [
  // 공통 안내 10개
  { name: 'common_start_01',   text: '시작해볼게요.',            prompt: PROMPTS.common },
  { name: 'common_ready_01',   text: '준비되셨죠?',              prompt: PROMPTS.common },
  { name: 'common_3sec_01',    text: '3초 뒤 시작합니다.',       prompt: PROMPTS.common },
  { name: 'common_half_01',    text: '절반 왔어요.',             prompt: PROMPTS.common },
  { name: 'common_10sec_01',   text: '10초 남았어요.',           prompt: PROMPTS.common },
  { name: 'common_5sec_01',    text: '5초 남았어요.',            prompt: PROMPTS.common },
  { name: 'common_last_01',    text: '거의 다 왔어요.',          prompt: PROMPTS.common },
  { name: 'common_end_01',     text: '종료됐어요.',              prompt: PROMPTS.common },
  { name: 'common_restart_01', text: '다시 시작해볼게요.',       prompt: PROMPTS.common },
  { name: 'common_done_01',    text: '한 세트 완료예요.',        prompt: PROMPTS.common },

  // 운동용 8개
  { name: 'workout_push_01',   text: '좋아요, 그대로 갑니다.',   prompt: PROMPTS.workout },
  { name: 'workout_push_02',   text: '조금만 더 버텨볼게요.',    prompt: PROMPTS.workout },
  { name: 'workout_push_03',   text: '정말 잘하고 있어요!',       prompt: PROMPTS.workout },
  { name: 'workout_push_04',   text: '리듬 좋아요.',             prompt: PROMPTS.workout },
  { name: 'workout_push_05',   text: '힘들어도 한 번 더 가요.', prompt: PROMPTS.workout },
  { name: 'workout_round_01',  text: '다음 라운드 시작합니다.', prompt: PROMPTS.workout },
  { name: 'workout_hold_01',   text: '그대로 유지해요.',         prompt: PROMPTS.workout },
  { name: 'workout_finish_01', text: '운동 구간 끝났어요.',      prompt: PROMPTS.workout },

  // 휴식용 6개
  { name: 'rest_start_01',   text: '쉬는 시간이에요.',           prompt: PROMPTS.rest },
  { name: 'rest_breathe_01', text: '숨 한번 고를게요.',           prompt: PROMPTS.rest },
  { name: 'rest_half_01',    text: '휴식도 절반 지났어요.',       prompt: PROMPTS.rest },
  { name: 'rest_10sec_01',   text: '곧 다시 시작해요.',           prompt: PROMPTS.rest },
  { name: 'rest_ready_01',   text: '준비해주세요.',               prompt: PROMPTS.rest },
  { name: 'rest_end_01',     text: '쉬는 시간 끝, 다시 갑니다.', prompt: PROMPTS.rest },

  // 양치용 6개
  { name: 'brush_start_01',  text: '양치 시작해볼까요?',         prompt: PROMPTS.brush },
  { name: 'brush_top_01',    text: '위쪽부터 닦아볼게요.',       prompt: PROMPTS.brush },
  { name: 'brush_bottom_01', text: '아래쪽도 닦아볼까요?',       prompt: PROMPTS.brush },
  { name: 'brush_left_01',   text: '왼쪽도 깨끗하게요.',         prompt: PROMPTS.brush },
  { name: 'brush_right_01',  text: '오른쪽도 닦아볼게요.',       prompt: PROMPTS.brush },
  { name: 'brush_end_01',    text: '우와, 양치 끝!',             prompt: PROMPTS.brush },

  // 라운드 번호 1~10 (인터벌 라운드 안내용)
  { name: 'num_round_1',  text: '일 라운드.',  prompt: PROMPTS.common },
  { name: 'num_round_2',  text: '이 라운드.',  prompt: PROMPTS.common },
  { name: 'num_round_3',  text: '삼 라운드.',  prompt: PROMPTS.common },
  { name: 'num_round_4',  text: '사 라운드.',  prompt: PROMPTS.common },
  { name: 'num_round_5',  text: '다섯 번째 라운드.',  prompt: PROMPTS.common },
  { name: 'num_round_6',  text: '육 라운드.',  prompt: PROMPTS.common },
  { name: 'num_round_7',  text: '칠 라운드.',  prompt: PROMPTS.common },
  { name: 'num_round_8',  text: '팔 라운드.',  prompt: PROMPTS.common },
  { name: 'num_round_9',  text: '구 라운드.',  prompt: PROMPTS.common },
  { name: 'num_round_10', text: '십 라운드.',  prompt: PROMPTS.common },

  // 추임새/리액션 3개
  { name: 'reaction_cheer_01', text: '좋아요.',              prompt: PROMPTS.reaction },
  { name: 'reaction_cheer_02', text: '오, 잘하고 있어요.',   prompt: PROMPTS.reaction },
  { name: 'reaction_01',       text: '와, 정말 잘했어요!',   prompt: PROMPTS.reaction },

  // ─── 랜덤 문구 확장 (A급 3개 / B급 2개 전략) ────────────────────────────────
  // common_start ×3
  { name: 'common_start_02',    text: '바로 시작합니다.',           prompt: PROMPTS.common },
  { name: 'common_start_03',    text: '좋아요, 시작해볼게요.',      prompt: PROMPTS.common },
  // common_half ×3
  { name: 'common_half_02',     text: '반 정도 왔어요.',            prompt: PROMPTS.common },
  { name: 'common_half_03',     text: '좋아요, 절반 넘겼어요.',     prompt: PROMPTS.common },
  // common_10sec ×3
  { name: 'common_10sec_02',    text: '이제 10초만 남았어요.',      prompt: PROMPTS.common },
  { name: 'common_10sec_03',    text: '10초, 조금만 더 가볼게요.',  prompt: PROMPTS.common },
  // common_last ×2
  { name: 'common_last_02',     text: '마무리만 남았어요.',         prompt: PROMPTS.common },
  // common_end ×2
  { name: 'common_end_02',      text: '여기까지 완료예요.',         prompt: PROMPTS.common },
  // reaction_cheer ×3
  { name: 'reaction_cheer_03',  text: '아주 좋아요.',               prompt: PROMPTS.reaction },
  // rest_start ×2
  { name: 'rest_start_02',      text: '잠깐 쉬어갈게요.',           prompt: PROMPTS.rest },
  // rest_breathe ×2
  { name: 'rest_breathe_02',    text: '천천히 숨 쉬어볼게요.',      prompt: PROMPTS.rest },

  // ─── 명상 10개 (SSML <break> 로 문장 사이 침묵 삽입) ────────────────────────
  // 시작 1개
  {
    name: 'meditation_start_01',
    prompt: PROMPTS.meditation,
    text: '<speak><prosody rate="90%" pitch="-2st">숨을 천천히 들이마십니다<break time="2000ms"/>부드럽게 내쉽니다</prosody></speak>',
  },
  // 중간 8개 (랜덤 재생용)
  {
    name: 'meditation_mid_01',
    prompt: PROMPTS.meditation,
    text: '<speak><prosody rate="90%" pitch="-2st">지금 이 순간에 집중해봅니다<break time="3000ms"/>아무 생각도 하지 않아도 괜찮습니다</prosody></speak>',
  },
  {
    name: 'meditation_mid_02',
    prompt: PROMPTS.meditation,
    text: '<speak><prosody rate="90%" pitch="-2st">어깨의 힘을 빼고<break time="2000ms"/>편안하게 호흡합니다</prosody></speak>',
  },
  {
    name: 'meditation_mid_03',
    prompt: PROMPTS.meditation,
    text: '<speak><prosody rate="90%" pitch="-2st">들이마시고<break time="2000ms"/>내쉽니다</prosody></speak>',
  },
  {
    name: 'meditation_mid_04',
    prompt: PROMPTS.meditation,
    text: '<speak><prosody rate="90%" pitch="-2st">천천히 호흡을 느껴봅니다<break time="3000ms"/>숨의 흐름을 따라갑니다</prosody></speak>',
  },
  {
    name: 'meditation_mid_05',
    prompt: PROMPTS.meditation,
    text: '<speak><prosody rate="90%" pitch="-2st">괜찮습니다<break time="2000ms"/>지금 그대로 충분합니다</prosody></speak>',
  },
  {
    name: 'meditation_mid_06',
    prompt: PROMPTS.meditation,
    text: '<speak><prosody rate="90%" pitch="-2st">생각이 떠오르면<break time="2000ms"/>흘려보냅니다</prosody></speak>',
  },
  {
    name: 'meditation_mid_07',
    prompt: PROMPTS.meditation,
    text: '<speak><prosody rate="90%" pitch="-2st">조용히<break time="2000ms"/>호흡에 집중합니다</prosody></speak>',
  },
  {
    name: 'meditation_mid_08',
    prompt: PROMPTS.meditation,
    text: '<speak><prosody rate="90%" pitch="-2st">천천히 들이마시고<break time="2000ms"/>길게 내쉽니다</prosody></speak>',
  },
  // 종료 1개
  {
    name: 'meditation_end_01',
    prompt: PROMPTS.meditation,
    text: '<speak><prosody rate="90%" pitch="-2st">마무리할 시간입니다<break time="2000ms"/>천천히 눈을 뜹니다<break time="2000ms"/>오늘도 충분히 잘 해냈어요</prosody></speak>',
  },

  // ─── 수면 유도 8개 ────────────────────────────────────────────────────────────
  {
    name: 'sleep_start_01',
    prompt: PROMPTS.sleep,
    text: '<speak><prosody rate="80%" pitch="-3st">이제 편안하게 눈을 감아요<break time="3000ms"/>하루 수고 많으셨어요</prosody></speak>',
  },
  {
    name: 'sleep_mid_01',
    prompt: PROMPTS.sleep,
    text: '<speak><prosody rate="80%" pitch="-3st">천천히 숨을 들이마시고<break time="3000ms"/>부드럽게 내쉬어요</prosody></speak>',
  },
  {
    name: 'sleep_mid_02',
    prompt: PROMPTS.sleep,
    text: '<speak><prosody rate="80%" pitch="-3st">몸의 힘을 완전히 놓아요<break time="4000ms"/>편안해요</prosody></speak>',
  },
  {
    name: 'sleep_mid_03',
    prompt: PROMPTS.sleep,
    text: '<speak><prosody rate="75%" pitch="-3st">아무 생각도 하지 않아도 괜찮아요<break time="4000ms"/>그냥 쉬어요</prosody></speak>',
  },
  {
    name: 'sleep_mid_04',
    prompt: PROMPTS.sleep,
    text: '<speak><prosody rate="75%" pitch="-3st">깊고 편안한 호흡<break time="5000ms"/>몸이 점점 무거워져요</prosody></speak>',
  },
  {
    name: 'sleep_mid_05',
    prompt: PROMPTS.sleep,
    text: '<speak><prosody rate="70%" pitch="-3st">잘 하고 있어요<break time="5000ms"/>이대로 쉬어요</prosody></speak>',
  },
  {
    name: 'sleep_mid_06',
    prompt: PROMPTS.sleep,
    text: '<speak><prosody rate="70%" pitch="-4st">편안해요<break time="6000ms"/>잘 자요</prosody></speak>',
  },
  {
    name: 'sleep_end_01',
    prompt: PROMPTS.sleep,
    text: '<speak><prosody rate="75%" pitch="-3st">푹 쉬세요<break time="3000ms"/>잘 자요</prosody></speak>',
  },

  // ─── ASMR 호흡 7개 ───────────────────────────────────────────────────────────
  {
    name: 'asmr_start_01',
    prompt: PROMPTS.asmr,
    text: '<speak><prosody rate="80%" pitch="-2st">천천히 눈을 감아요<break time="3000ms"/>아주 부드럽게 호흡해볼게요</prosody></speak>',
  },
  {
    name: 'asmr_mid_01',
    prompt: PROMPTS.asmr,
    text: '<speak><prosody rate="80%" pitch="-2st">들이마시고<break time="3000ms"/>내쉬어요</prosody></speak>',
  },
  {
    name: 'asmr_mid_02',
    prompt: PROMPTS.asmr,
    text: '<speak><prosody rate="75%" pitch="-2st">어깨의 힘을 빼요<break time="4000ms"/>편안해요</prosody></speak>',
  },
  {
    name: 'asmr_mid_03',
    prompt: PROMPTS.asmr,
    text: '<speak><prosody rate="75%" pitch="-2st">감각에 집중해봐요<break time="4000ms"/>지금 이 순간만</prosody></speak>',
  },
  {
    name: 'asmr_mid_04',
    prompt: PROMPTS.asmr,
    text: '<speak><prosody rate="75%" pitch="-2st">천천히<break time="3000ms"/>아주 천천히 호흡해요</prosody></speak>',
  },
  {
    name: 'asmr_mid_05',
    prompt: PROMPTS.asmr,
    text: '<speak><prosody rate="70%" pitch="-2st">몸이 이완돼요<break time="4000ms"/>마음도 고요해요</prosody></speak>',
  },
  {
    name: 'asmr_end_01',
    prompt: PROMPTS.asmr,
    text: '<speak><prosody rate="75%" pitch="-2st">잘 하셨어요<break time="3000ms"/>편안히 쉬세요</prosody></speak>',
  },
]

// ─── 숫자 파일 목록 생성 ─────────────────────────────────────────────────────

/** 한자음 숫자 (시간 카운트다운용): 일, 이, 삼 ... 백 */
function buildSinoFiles() {
  const digits = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구']
  const result = []
  for (let i = 1; i <= 100; i++) {
    let text
    if (i === 100) {
      text = '백'
    } else if (i < 10) {
      text = digits[i]
    } else {
      const t = Math.floor(i / 10)
      const o = i % 10
      const tensText = t === 1 ? '십' : digits[t] + '십'
      text = tensText + (o === 0 ? '' : digits[o])
    }
    result.push({ name: `num_sino_${i}`, text: `${text}.`, prompt: PROMPTS.number })
  }
  return result
}

/** 고유어 숫자 (횟수 카운트업용): 하나, 둘, 셋 ... 백 */
function buildNativeFiles() {
  const ones = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉']
  const tens = ['', '열', '스물', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔']
  const result = []
  for (let i = 1; i <= 100; i++) {
    let text
    if (i === 100) {
      text = '백'
    } else {
      const t = Math.floor(i / 10)
      const o = i % 10
      text = tens[t] + ones[o]
    }
    result.push({ name: `num_native_${i}`, text: `${text}.`, prompt: PROMPTS.number })
  }
  return result
}

const numberFiles = [...buildSinoFiles(), ...buildNativeFiles()]

// 우선순위 숫자: 마지막5초(1~5) + 마지막10초(1~10) + 10초마다(10,20..90) 커버
// sino 1~10, 20, 30, 40, 50, 60, 70, 80, 90 = 18개
const PRIORITY_SINO = new Set([1,2,3,4,5,6,7,8,9,10,20,30,40,50,60,70,80,90])
const priorityNumberFiles = buildSinoFiles().filter(f => {
  const n = parseInt(f.name.replace('num_sino_', ''))
  return PRIORITY_SINO.has(n)
})

// fix 모드: 누락/오류 확인된 파일만
const fixFiles = [
  // energy 폴더에서 오류났던 숫자
  { name: 'num_sino_70', text: '칠십.', prompt: PROMPTS.number },
  // 카운트업용 고유어 1~30 (default/energy 모두 없음)
  ...(() => {
    const ones = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉']
    const tens = ['', '열', '스물', '서른']
    const result = []
    for (let i = 1; i <= 30; i++) {
      const t = Math.floor(i / 10)
      const o = i % 10
      result.push({ name: `num_native_${i}`, text: `${tens[t] + ones[o]}.`, prompt: PROMPTS.number })
    }
    return result
  })(),
]

// ─────────────────────────────────────────────────────────────────────────────

function pcmToWav(pcmBuffer, sampleRate = 24000, channels = 1, bitDepth = 16) {
  const dataSize = pcmBuffer.length
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + dataSize, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(channels, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(sampleRate * channels * (bitDepth / 8), 28)
  header.writeUInt16LE(channels * (bitDepth / 8), 32)
  header.writeUInt16LE(bitDepth, 34)
  header.write('data', 36)
  header.writeUInt32LE(dataSize, 40)
  return Buffer.concat([header, pcmBuffer])
}

function synthesizeWithKey(file, apiKey) {
  return new Promise((resolve, reject) => {
    // SSML 파일: prompt 없이 text만 사용 (prosody 태그 포함)
    const inputText = file.prompt ? `${file.prompt} ${file.text}` : file.text
    const body = JSON.stringify({
      contents: [{ parts: [{ text: inputText }], role: 'user' }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: config.voice } } }
      }
    })
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if (json.error) { reject(new Error(`${json.error.code}: ${json.error.message}`)); return }
          const part = json.candidates?.[0]?.content?.parts?.[0]
          if (!part?.inlineData?.data) { reject(new Error('오디오 데이터 없음')); return }
          const wav = pcmToWav(Buffer.from(part.inlineData.data, 'base64'))
          fs.writeFileSync(path.join(OUTPUT_DIR, `${file.name}.wav`), wav)
          resolve()
        } catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

async function synthesize(file) {
  // 현재 키로 시도, 429 시 다음 키로 순환
  // "오디오 데이터 없음"은 간헐적 빈 응답 → 최대 3회 재시도
  const MAX_EMPTY_RETRY = 3
  let emptyRetry = 0
  while (currentKeyIndex < API_KEYS.length) {
    const key = API_KEYS[currentKeyIndex]
    try {
      await synthesizeWithKey(file, key)
      return
    } catch (e) {
      if (e.message.includes('429')) {
        currentKeyIndex++
        if (currentKeyIndex < API_KEYS.length) {
          console.log(`\n⚠️  키 ${currentKeyIndex} 할당량 소진 → 키 ${currentKeyIndex + 1}로 전환\n`)
        } else {
          throw new Error(`모든 키 소진 (${API_KEYS.length}개): ${e.message}`)
        }
      } else if (e.message.includes('오디오 데이터 없음')) {
        emptyRetry++
        if (emptyRetry < MAX_EMPTY_RETRY) {
          console.log(`  ↻ 빈 응답 재시도 ${emptyRetry}/${MAX_EMPTY_RETRY - 1}: ${file.name}`)
          await new Promise(r => setTimeout(r, 3000))
        } else {
          throw e
        }
      } else {
        throw e
      }
    }
  }
}

async function runBatch(label, batch) {
  console.log(`\n🎙️  ${label} (${batch.length}개)\n`)
  let success = 0, fail = 0
  for (const file of batch) {
    const filePath = path.join(OUTPUT_DIR, `${file.name}.wav`)
    if (fs.existsSync(filePath)) { console.log(`⏭️  스킵: ${file.name}.wav`); success++; continue }
    try {
      await synthesize(file)
      console.log(`✅ ${file.name}.wav  →  "${file.text}"`)
      success++
    } catch (e) {
      console.error(`❌ ${file.name}  →  ${e.message}`)
      fail++
      if (e.message.includes('모든 키 소진')) {
        console.error('\n🛑 모든 API 키 할당량 소진. 내일 다시 실행하거나 키를 추가하세요.')
        break
      }
    }
    await new Promise(r => setTimeout(r, 7000))
  }
  return { success, fail }
}

async function main() {
  console.log(`🎙️  Gemini 2.5 Flash TTS — ${config.label}`)
  console.log(`📁 출력: ${OUTPUT_DIR}`)
  console.log(`🗂️  모드: ${TARGET_MODE}`)
  console.log(`🔑 API 키: ${API_KEYS.length}개 (할당량 합계 ~${API_KEYS.length * 100}회)\n`)
  console.log('사용법:')
  console.log('  node generate_audio.cjs [voice]                              → 기본 멘트 (main)')
  console.log('  node generate_audio.cjs [voice] fix                          → 누락/오류 파일만 (~5분)')
  console.log('  node generate_audio.cjs [voice] priority                     → 우선 숫자 18개 (~2분)')
  console.log('  node generate_audio.cjs [voice] numbers                      → 숫자 200개 (~23분)')
  console.log('  node generate_audio.cjs [voice] all                          → 전체 233개')
  console.log('  node generate_audio.cjs [voice] select file1,file2,file3     → 선택 파일만\n')

  let totalSuccess = 0, totalFail = 0

  // ── 선택 파일만 생성 (웹 UI "직접 실행"에서 호출) ──────────────────────────
  if (TARGET_MODE === 'select') {
    if (!SELECT_NAMES || SELECT_NAMES.size === 0) {
      console.error('❌ select 모드: 파일명을 콤마로 지정하세요')
      console.error('   예: node generate_audio.cjs default select common_start_01,meditation_mid_01')
      process.exit(1)
    }
    // 전체 파일 풀에서 이름 매칭
    const allPool = [...files, ...numberFiles, ...fixFiles]
    const seen = new Set()
    const selectBatch = []
    for (const name of SELECT_NAMES) {
      if (seen.has(name)) continue
      seen.add(name)
      const found = allPool.find(f => f.name === name)
      if (found) {
        selectBatch.push(found)
      } else {
        console.warn(`⚠️  파일 정의 없음 (스킵): ${name}`)
      }
    }
    console.log(`\n🎯 select 모드 — ${selectBatch.length}개 파일만 생성`)
    const r = await runBatch('선택 파일', selectBatch)
    totalSuccess += r.success; totalFail += r.fail
    console.log(`\n완료: ${totalSuccess}개 성공 / ${totalFail}개 실패`)
    return
  }

  if (TARGET_MODE === 'fix') {
    console.log(`\n🔧 fix 모드 — 누락/오류 파일 ${fixFiles.length}개 (~${Math.ceil(fixFiles.length * 7 / 60)}분)`)
    const r = await runBatch('누락·오류 파일 보정', fixFiles)
    totalSuccess += r.success; totalFail += r.fail
  }

  if (TARGET_MODE === 'main' || TARGET_MODE === 'all') {
    const r = await runBatch('기본 멘트 파일', files)
    totalSuccess += r.success; totalFail += r.fail
  }

  if (TARGET_MODE === 'priority') {
    console.log(`\n⚡ 우선순위 숫자 18개 — 마지막5초/10초 + 10초마다 완전 커버`)
    const r = await runBatch('한자음 우선 숫자 (1~10, 10의배수)', priorityNumberFiles)
    totalSuccess += r.success; totalFail += r.fail
  }

  if (TARGET_MODE === 'numbers' || TARGET_MODE === 'all') {
    console.log(`\n⚠️  숫자 200개 생성 — 약 ${Math.ceil(200 * 7 / 60)}분 소요`)
    const r = await runBatch('숫자 파일 (한자음 + 고유어 각 100개)', numberFiles)
    totalSuccess += r.success; totalFail += r.fail
  }

  console.log(`\n완료: ${totalSuccess}개 성공 / ${totalFail}개 실패`)
  if (totalFail === 0) console.log('🎉 완료!')
}

main()
