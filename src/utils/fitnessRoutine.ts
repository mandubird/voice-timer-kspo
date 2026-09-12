/**
 * 국민체력100 자가입력 기반 맞춤 루틴 로직
 *
 * 주의: data.go.kr 국민체력100 측정결과 API(item_f001~052)는 필드 정의가 비공개라
 * "이 필드가 근력/심폐지구력/유연성 점수다"라고 정확히 매핑할 근거가 없다.
 * 그래서 개인화의 기준은 "사용자가 직접 입력한 자신의 측정 등급"으로 삼고,
 * 공공데이터(pres_note 처방 사례)는 참고용 부가 정보로만 별도 사용한다(kspoApi.ts, FitnessGoalPage.tsx 참고).
 */

export type FitnessCategory = 'strength' | 'cardio' | 'flexibility'

export interface FitnessSelfAssessment {
  strength: number // 1(부족) ~ 5(우수)
  cardio: number
  flexibility: number
}

export interface FitnessHistoryEntry extends FitnessSelfAssessment {
  dateISO: string
}

export const CATEGORY_LABEL: Record<FitnessCategory, string> = {
  strength: '근력',
  cardio: '심폐지구력',
  flexibility: '유연성',
}

const EXERCISE_BANK: Record<FitnessCategory, string[]> = {
  strength: ['스쿼트', '무릎 대고 팔굽혀펴기', '런지', '플랭크', '벽 짚고 푸시업'],
  cardio: ['제자리 걷기', '제자리 뛰기', '천천히 버피', '계단 오르내리기', '사이드 스텝'],
  flexibility: ['앉아 윗몸 앞으로 굽히기', '목·어깨 스트레칭', '고양이·소 자세 스트레칭', '햄스트링 스트레칭', '전신 스트레칭'],
}

export interface RoutinePlan {
  exercises: string[]
  weakCategories: FitnessCategory[]
  weakLabel: string
  explanation: string
}

/** 세 항목 중 가장 낮은(취약한) 항목에 더 많은 운동을 배정해 최소 3개, 최대 6개 루틴을 만든다 */
export function buildRoutineFromAssessment(input: FitnessSelfAssessment): RoutinePlan {
  const order: FitnessCategory[] = ['strength', 'cardio', 'flexibility']
  const entries = order
    .map((key) => ({ key, score: input[key] }))
    .sort((a, b) => a.score - b.score)

  const minScore = entries[0].score
  const weakCategories = entries.filter((e) => e.score === minScore).map((e) => e.key)

  const quota = [3, 2, 1]
  const exercises: string[] = []
  entries.forEach((e, i) => {
    const bank = EXERCISE_BANK[e.key]
    const n = Math.min(quota[i] ?? 1, bank.length)
    const shuffled = [...bank].sort(() => Math.random() - 0.5)
    exercises.push(...shuffled.slice(0, n))
  })

  const weakLabel = weakCategories.map((k) => CATEGORY_LABEL[k]).join('·')
  const explanation =
    weakCategories.length > 1
      ? `${weakLabel}이 다른 항목보다 상대적으로 약한 편이라, 이 부분을 채우는 루틴으로 구성했어요.`
      : `${weakLabel}이 다른 항목보다 상대적으로 약한 편이라, ${weakLabel} 위주로 루틴을 구성했어요.`

  return { exercises, weakCategories, weakLabel, explanation }
}

const HISTORY_KEY = 'vtk_fitness_history_v1'

export function getFitnessHistory(): FitnessHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveFitnessHistoryEntry(entry: FitnessSelfAssessment): void {
  const history = getFitnessHistory()
  const next: FitnessHistoryEntry[] = [...history, { ...entry, dateISO: new Date().toISOString() }].slice(-20)
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  } catch {
    // localStorage를 쓸 수 없는 환경 — 조용히 무시 (기록 기능만 비활성)
  }
}

export function getPreviousFitnessEntry(history: FitnessHistoryEntry[]): FitnessHistoryEntry | null {
  return history.length > 0 ? history[history.length - 1] : null
}

export function describeDelta(current: FitnessSelfAssessment, previous: FitnessHistoryEntry | null): string | null {
  if (!previous) return null
  const order: FitnessCategory[] = ['strength', 'cardio', 'flexibility']
  const parts: string[] = []
  order.forEach((key) => {
    const diff = current[key] - previous[key]
    if (diff !== 0) parts.push(`${CATEGORY_LABEL[key]} ${diff > 0 ? '+' : ''}${diff}`)
  })
  if (parts.length === 0) return '지난 측정과 같은 수준이에요 — 꾸준히 유지하고 있어요!'
  return `지난 측정 대비 ${parts.join(', ')} 변화가 있었어요.`
}
