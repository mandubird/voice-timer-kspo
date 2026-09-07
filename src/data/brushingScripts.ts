import type { BrushingScript } from '../types'

/**
 * 2분 루틴 — 4구역 × 30초
 * 위 앞니(0-20) → 위 어금니(20-50) → 아래 앞니(50-80) → 아래 어금니(80-110) → 마무리(110-120)
 */
export const BRUSHING_SCRIPTS_120: BrushingScript[] = [
  { triggerSeconds: 0,   text: '시작! 위쪽 앞니부터 닦아요.' },
  { triggerSeconds: 20,  text: '위쪽 어금니로 이동해요.' },
  { triggerSeconds: 50,  text: '아래쪽 앞니 차례예요.' },
  { triggerSeconds: 80,  text: '아래쪽 어금니도 꼼꼼히요.' },
  { triggerSeconds: 110, text: '거의 다 왔어요! 마무리해요.' },
  { triggerSeconds: 120, text: '완벽해요! 깨끗한 치아!' },
]

/**
 * 3분 루틴 — 6구역 × 약 25~30초 (아이루틴)
 * 위 앞니(0-20) → 위 오른쪽(20-50) → 위 왼쪽(50-80)
 * → 아래 앞니(80-105) → 아래 오른쪽(105-135) → 아래 왼쪽(135-160)
 * → 혀·마무리(160-180)
 */
export const BRUSHING_SCRIPTS_180: BrushingScript[] = [
  { triggerSeconds: 0,   text: '시작! 위쪽 앞니부터 닦아요.' },
  { triggerSeconds: 20,  text: '위쪽 오른쪽 어금니로 이동해요.' },
  { triggerSeconds: 50,  text: '위쪽 왼쪽 어금니도 닦아요.' },
  { triggerSeconds: 80,  text: '이제 아래쪽 앞니 차례예요.' },
  { triggerSeconds: 105, text: '아래쪽 오른쪽 어금니로요.' },
  { triggerSeconds: 135, text: '아래쪽 왼쪽 어금니도 꼼꼼히요.' },
  { triggerSeconds: 160, text: '혀도 살짝 닦고 마무리해요!' },
  { triggerSeconds: 180, text: '너무 잘했어요! 완료!' },
]

export function getBrushingScripts(totalSeconds: 120 | 180): BrushingScript[] {
  return totalSeconds === 120 ? BRUSHING_SCRIPTS_120 : BRUSHING_SCRIPTS_180
}
