import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { useSessionStore } from '../store/sessionStore'
import { useSettingsStore, getVoiceProfileFromPack } from '../store/settingsStore'
import { resumeAudioContext } from '../utils/soundEffects'
import { stopAllVoiceOutput } from '../utils/audioPlayer'
import { pickBestKoreanVoice } from '../hooks/useVoice'
import { speakText } from '../utils/speechUtils'
import { fetchFitness100Sample, parsePresNote } from '../services/kspoApi'
import {
  buildRoutineFromAssessment,
  getFitnessHistory,
  getPreviousFitnessEntry,
  saveFitnessHistoryEntry,
  describeDelta,
  CATEGORY_LABEL,
  type FitnessCategory,
  type FitnessSelfAssessment,
  type RoutinePlan,
} from '../utils/fitnessRoutine'
import type { ActiveSessionConfig, IntervalSettings } from '../types'

const chip = (on: boolean) =>
  on
    ? 'border-[#2F6BFF] bg-[#F3F7FF] text-[#2F6BFF] shadow-sm'
    : 'border-[#E8EAF0] bg-white text-[#111111] hover:border-[#D0D4E0]'

const SCORE_OPTIONS = [1, 2, 3, 4, 5]

const CIRCLED: Record<number, string> = { 1: '①', 2: '②', 3: '③', 4: '④', 5: '⑤' }

const CATEGORY_FIELDS: { key: FitnessCategory; hint: string }[] = [
  { key: 'strength', hint: '팔굽혀펴기 · 악력 등' },
  { key: 'cardio', hint: '왕복 오래달리기 · 걷기 등' },
  { key: 'flexibility', hint: '앉아 윗몸 앞으로 굽히기 등' },
]

type Step = 'form' | 'result'

export default function FitnessGoalPage() {
  const navigate = useNavigate()
  const audioPack = useSettingsStore((s) => s.audioPack)

  const [assessment, setAssessment] = useState<FitnessSelfAssessment>({ strength: 3, cardio: 3, flexibility: 3 })
  const [step, setStep] = useState<Step>('form')
  const [plan, setPlan] = useState<RoutinePlan | null>(null)
  const [deltaMsg, setDeltaMsg] = useState<string | null>(null)
  const [referenceNote, setReferenceNote] = useState<string | null>(null)

  useEffect(() => {
    // 화면 진입 시 조용히 한 번 — 국민체력100 실제 참고 처방 사례를 가져와 결과 화면에 참고용으로 덧붙인다
    // (개인 맞춤 판단의 근거는 아래 자가입력이며, 이건 어디까지나 "실제 이런 사례도 있어요" 참고 정보)
    fetchFitness100Sample({ numOfRows: 50 })
      .then((records) => {
        const withNote = records.find((r) => (r.pres_note ?? '').trim().length > 0)
        if (withNote) {
          const list = parsePresNote(withNote.pres_note).slice(0, 4)
          if (list.length > 0) setReferenceNote(list.join(', '))
        }
      })
      .catch(() => {
        // 참고 정보 로드 실패는 핵심 기능에 영향 없음 — 조용히 무시
      })
  }, [])

  const buildRoutine = () => {
    const previous = getPreviousFitnessEntry(getFitnessHistory())
    const nextPlan = buildRoutineFromAssessment(assessment)
    setPlan(nextPlan)
    setDeltaMsg(describeDelta(assessment, previous))
    saveFitnessHistoryEntry(assessment)
    setStep('result')
  }

  const startRoutine = () => {
    if (!plan) return
    const exercises = plan.exercises
    const voiceProfile = getVoiceProfileFromPack(audioPack)
    const startScript = `${plan.weakLabel} 강화에 집중한 오늘의 루틴이에요. 순서대로 안내해드릴게요!`

    const settings: IntervalSettings = {
      workSeconds: 30,
      restSeconds: 10,
      rounds: exercises.length,
      announceMode: 'every10',
      voiceProfile,
      vibration: true,
      sound: true,
      startScript,
      roundLabels: exercises,
    }
    const active: ActiveSessionConfig = { mode: 'interval', settings }

    // 이 루틴은 매번 다른 운동 목록을 나열하는 문구라 사전 녹음(wav) 안내가 없으므로,
    // 공용 시작 효과음(common_start wav)+휘슬 대신 이 안내만 단독으로 들려준다.
    // (같이 재생하면 wav 안내음/휘슬과 TTS 음성이 겹쳐서 서로 묻히는 문제가 있었음)
    void resumeAudioContext()
    stopAllVoiceOutput()
    const voice = pickBestKoreanVoice(voiceProfile.gender)
    speakText(startScript, voiceProfile, { interrupt: false, voice })

    useSessionStore.getState().loadSession(active, { startPaused: true })
    navigate('/session')
    // 안내 문구를 다 읽을 때까지 기다렸다가 세션을 시작 (글자수 기반 추정 + 여유시간)
    const estimatedSpeechMs = Math.max(2200, startScript.length * 90 + 800)
    window.setTimeout(() => useSessionStore.getState().resume(), estimatedSpeechMs)
  }

  return (
    <PageShell title="국민체력100 기반 맞춤 루틴">
      <div className="space-y-6 text-[#111111]">
        <p className="text-[13px] leading-relaxed text-[#7A7F8A]">
          현재 체력 수준을 입력해 주세요. 국민체력100 측정 결과가 있다면 참고해서 선택하고, 없다면 평소
          체감 수준으로 입력해도 좋아요. 가장 부족한 항목을 채워주는 오늘의 루틴을 만들어드려요 — 처방이
          아니니 개인 컨디션에 맞게 조절해 주세요.
        </p>

        {step === 'form' && (
          <>
            {CATEGORY_FIELDS.map((field) => (
              <section key={field.key} className="rounded-[18px] border border-[#E8EAF0] bg-white p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-[#111111]">{CATEGORY_LABEL[field.key]}</h2>
                <p className="mt-0.5 text-[11px] text-[#7A7F8A]">{field.hint}</p>
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {SCORE_OPTIONS.map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setAssessment((prev) => ({ ...prev, [field.key]: score }))}
                      className={[
                        'min-h-11 rounded-[14px] border text-sm font-semibold transition',
                        chip(assessment[field.key] === score),
                      ].join(' ')}
                    >
                      {score}
                    </button>
                  ))}
                </div>
                <div className="mt-1 grid grid-cols-3 text-[10px] text-[#B0B4BE]">
                  <span className="text-left">1 · 부족</span>
                  <span className="text-center">3 · 보통</span>
                  <span className="text-right">5 · 우수</span>
                </div>
              </section>
            ))}

            <button
              type="button"
              onClick={buildRoutine}
              className="min-h-12 w-full rounded-[16px] bg-[#2F6BFF] text-[15px] font-bold text-white shadow-sm transition active:scale-[0.99]"
            >
              추천 루틴 만들기
            </button>
          </>
        )}

        {step === 'result' && plan && (
          <>
            <section className="rounded-[18px] border border-[#E8EAF0] bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-[#111111]">오늘의 추천 루틴</h2>
              <p className="mt-1 text-[11px] text-[#7A7F8A]">{plan.explanation}</p>
              <p className="mt-1.5 text-[11px] font-medium text-[#B0B4BE]">
                근력 {CIRCLED[assessment.strength]} · 심폐지구력 {CIRCLED[assessment.cardio]} · 유연성{' '}
                {CIRCLED[assessment.flexibility]}
              </p>
              {deltaMsg && (
                <p className="mt-2 rounded-[10px] bg-[#F3F7FF] px-3 py-2 text-[11px] font-medium text-[#2F6BFF]">
                  {deltaMsg}
                </p>
              )}
              <ol className="mt-3 space-y-2">
                {plan.exercises.map((ex, i) => (
                  <li
                    key={`${ex}-${i}`}
                    className="flex items-center gap-3 rounded-[12px] bg-[#F5F7FA] px-3 py-2 text-[14px] font-medium text-[#111111]"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#2F6BFF] text-[11px] font-bold text-white">
                      {i + 1}
                    </span>
                    {ex}
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-[11px] leading-relaxed text-[#7A7F8A]">
                각 동작 30초 · 휴식 10초로 진행돼요. 개인별 운동처방이 아니니, 무리되면 언제든 멈춰도 좋아요.
              </p>
              {referenceNote && (
                <p className="mt-2 text-[11px] leading-relaxed text-[#B0B4BE]">
                  참고: 국민체력100 실제 참가자 중에는 {referenceNote} 같은 처방을 받은 사례도 있어요.
                </p>
              )}
            </section>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="min-h-12 flex-1 rounded-[16px] border border-[#E8EAF0] bg-white text-[14px] font-bold text-[#111111]"
              >
                다시 설정
              </button>
              <button
                type="button"
                onClick={startRoutine}
                className="min-h-12 flex-[2] rounded-[16px] bg-[#2F6BFF] text-[15px] font-bold text-white shadow-sm transition active:scale-[0.99]"
              >
                이 루틴으로 시작하기
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigate('/facilities')}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[16px] border border-[#C9E9D9]/80 bg-[#EAFBF2] text-[13px] font-bold text-[#0F4D2A] transition active:scale-[0.99]"
            >
              <span aria-hidden>📍</span>
              집 말고 밖에서 하고 싶다면 — 내 동네 공공체육시설 찾아보기
            </button>
          </>
        )}
      </div>
    </PageShell>
  )
}
