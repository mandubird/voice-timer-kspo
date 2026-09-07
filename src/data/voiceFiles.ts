/**
 * 음성 클립 베이스명 중앙 매핑.
 * 실제 파일: `public/audio/default/{basename}.wav`
 *
 * 폴더 구조:
 *   public/audio/default/  ← 무료 기본 목소리
 *   public/audio/energy/   ← 유료 에너지 톤 (v1.5)
 *   public/audio/calm/     ← 유료 차분한 톤 (v2)
 *   public/audio/kids/     ← 유료 아이용 톤 (v2)
 */
export const voiceFiles = {
  common: {
    start:   ['common_start_01', 'common_start_02', 'common_start_03'],
    ready:   ['common_ready_01'],
    sec3:    ['common_3sec_01'],
    half:    ['common_half_01', 'common_half_02', 'common_half_03'],
    sec10:   ['common_10sec_01', 'common_10sec_02', 'common_10sec_03'],
    sec5:    ['common_5sec_01'],
    last:    ['common_last_01', 'common_last_02'],
    end:     ['common_end_01', 'common_end_02'],
    restart: ['common_restart_01'],
    done:    ['common_done_01'],
  },
  workout: {
    push: [
      'workout_push_01',
      'workout_push_02',
      'workout_push_03',
      'workout_push_04',
      'workout_push_05',
    ],
    round:  ['workout_round_01'],
    hold:   ['workout_hold_01'],
    finish: ['workout_finish_01'],
  },
  rest: {
    start:   ['rest_start_01', 'rest_start_02'],
    breathe: ['rest_breathe_01', 'rest_breathe_02'],
    half:    ['rest_half_01'],
    sec10:   ['rest_10sec_01'],
    ready:   ['rest_ready_01'],
    end:     ['rest_end_01'],
  },
  brush: {
    start: ['brush_start_01'],
    switch: [
      'brush_top_01',
      'brush_bottom_01',
      'brush_left_01',
      'brush_right_01',
    ],
    end: ['brush_end_01'],
  },
  reaction: {
    cheer: ['reaction_cheer_01', 'reaction_cheer_02', 'reaction_cheer_03'],
    kids:  ['reaction_01'],
  },
  meditation: {
    start: ['meditation_start_01'],
    mid: [
      'meditation_mid_01',
      'meditation_mid_02',
      'meditation_mid_03',
      'meditation_mid_04',
      'meditation_mid_05',
      'meditation_mid_06',
      'meditation_mid_07',
      'meditation_mid_08',
    ],
    end: ['meditation_end_01'],
  },
  sleep: {
    start: ['sleep_start_01'],
    mid: [
      'sleep_mid_01',
      'sleep_mid_02',
      'sleep_mid_03',
      'sleep_mid_04',
      'sleep_mid_05',
      'sleep_mid_06',
    ],
    end: ['sleep_end_01'],
  },
  asmr: {
    start: ['asmr_start_01'],
    mid: [
      'asmr_mid_01',
      'asmr_mid_02',
      'asmr_mid_03',
      'asmr_mid_04',
      'asmr_mid_05',
    ],
    end: ['asmr_end_01'],
  },
} as const

/**
 * 숫자 wav 파일명 (동적 생성).
 * sino: 시간 카운트다운용 (일, 이, 삼...)
 * native: 횟수 카운트업용 (하나, 둘, 셋...)
 */
export const numFiles = {
  sino:   (n: number) => `num_sino_${n}`,
  native: (n: number) => `num_native_${n}`,
}

/** 배열에서 랜덤 1개 반환 */
export function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
