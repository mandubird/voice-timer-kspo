import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { useSessionStore } from '../store/sessionStore'
import { useSettingsStore, getVoiceProfileFromPack } from '../store/settingsStore'
import { primeSpeechFromUserGesture } from '../utils/sessionSpeechPrime'
import { pickBestKoreanVoice } from '../hooks/useVoice'
import { speakText } from '../utils/speechUtils'
import { fetchFitness100Sample, parsePresNote, type Fitness100Record } from '../services/kspoApi'
import type { ActiveSessionConfig, IntervalSettings } from '../types'

const chip = (on: boolean) =>
  on
    ? 'border-[#2F6BFF] bg-[#F3F7FF] text-[#2F6BFF] shadow-sm'
    : 'border-[#E8EAF0] bg-white text-[#111111] hover:border-[#D0D4E0]'

const AGE_OPTIONS = [
  { value: '20', label: '20대' },
  { value: '30', label: '30대' },
  { value: '40', label: '40대' },
  { value: '50', label: '50대' },
  { value: '60', label: '60대' },
  { value: '70', label: '70대 이상' },
]

const LEVEL_OPTIONS = [
  { value: '참가', label: '가볍게 시작', hint: '스트레칭 위주' },
  { value: '3등급', label: '활동적으로', hint: '동작 강도 있음' },
]

type Step = 'form' | 'loading' | 'result' | 'error'

export default function FitnessGoalPage() {
  const navigate = useNavigate()
  const audioPack = useSettingsStore((s) => s.audioPack)

  const [ageClass, setAgeClass] = useState('30')
  const [sex, setSex] = useState<'F' | 'M'>('F')
  const [certGbn, setCertGbn] = useState('참가')
  const [step, setStep] = useState<Step>('form')
  const [exercises, setExercises] = useState<string[]>([])
  const [sourceInfo, setSourceInfo] = useState<{ ageClass: string; certGbn: string; testYm?: string } | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const buildRoutine = async () => {
    setStep('loading')
    setErrorMsg('')
    try {
      const records = await fetchFitness100Sample({ ageClass, sex, certGbn, numOfRows: 100 })

      // pres_note가 실제로 있는 레코드만 후보로
      const withNote = records.filter((r: Fitness100Record) => (r.pres_note ?? '').trim().length > 0)
      const pool = withNote.length > 0 ? withNote : records.filter((r) => (r.pres_note ?? '').length > 0)

      if (pool.length === 0) {
        setStep('error')
        setErrorMsg('이 조건에 맞는 국민체력100 참고 루틴을 찾지 못했어요. 다른 연령대나 강도로 다시 시도해 보세요.')
        return
      }

      const picked = pool[Math.floor(Math.random() * pool.length)]
      const list = parsePresNote(picked.pres_note).slice(0, 8)

      if (list.length === 0) {
        setStep('error')
        setErrorMsg('참고 데이터는 찾았지만 운동 목록을 읽어오지 못했어요. 다시 시도해 주세요.')
        return
      }

      setExercises(list)
      setSourceInfo({ ageClass: picked.age_class, certGbn: picked.cert_gbn, testYm: picked.test_ym })
      setStep('result')
    } catch (e) {
      setStep('error')
      setErrorMsg('국민체력100 데이터를 불러오지 못했어요. 네트워크 상태를 확인하거나 잠시 후 다시 시도해 주세요.')
      console.error(e)
    }
  }

  const startRoutine = () => {
    const rounds = Math.min(Math.max(exercises.length, 3), 8)
    const voiceProfile = getVoiceProfileFromPack(audioPack)
    const startScript = `국민체력100 참고 데이터를 바탕으로 만든 오늘의 루틴이에요. ${exercises
      .slice(0, rounds)
      .join(', ')} 순서로 진행할게요. 개인 컨디션에 맞게 조절하면서 시작할게요!`

    const settings: IntervalSettings = {
      workSeconds: 30,
      restSeconds: 10,
      rounds,
      announceMode: 'every10',
      voiceProfile,
      vibration: true,
      sound: true,
      startScript,
    }
    const active: ActiveSessionConfig = { mode: 'interval', settings }

    primeSpeechFromUserGesture(active)
    // 팩 설정과 무관하게 데이터 기반 루틴 안내는 확실히 들려준다
    const voice = pickBestKoreanVoice(voiceProfile.gender)
    speakText(startScript, voiceProfile, { interrupt: false, voice })

    useSessionStore.getState().loadSession(active, { startPaused: true })
    navigate('/session')
    window.setTimeout(() => useSessionStore.getState().resume(), 2600)
  }

  return (
    <PageShell title="국민체력100 맞춤 루틴">
      <div className="space-y-6 text-[#111111]">
        <p className="text-[13px] leading-relaxed text-[#7A7F8A]">
          국민체육진흥공단이 공개한 국민체력100 체력측정 참고 데이터를 바탕으로 오늘의 루틴을 만들어드려요.
          동일 연령대·강도 구간의 참고 기록이에요 — 처방이 아니니 개인 컨디션에 맞게 조절해 주세요.
        </p>

        {(step === 'form' || step === 'error') && (
          <>
            <section className="rounded-[18px] border border-[#E8EAF0] bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-[#111111]">연령대</h2>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {AGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAgeClass(opt.value)}
                    className={[
                      'min-h-11 rounded-[14px] border px-2 py-2 text-sm font-semibold transition',
                      chip(ageClass === opt.value),
                    ].join(' ')}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-[18px] border border-[#E8EAF0] bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-[#111111]">성별</h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSex('F')}
                  className={['min-h-11 rounded-[14px] border px-2 py-2 text-sm font-semibold transition', chip(sex === 'F')].join(' ')}
                >
                  여성
                </button>
                <button
                  type="button"
                  onClick={() => setSex('M')}
                  className={['min-h-11 rounded-[14px] border px-2 py-2 text-sm font-semibold transition', chip(sex === 'M')].join(' ')}
                >
                  남성
                </button>
              </div>
            </section>

            <section className="rounded-[18px] border border-[#E8EAF0] bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-[#111111]">오늘의 목표 강도</h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {LEVEL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCertGbn(opt.value)}
                    className={[
                      'min-h-14 rounded-[14px] border px-2 py-2 text-left text-sm font-semibold transition',
                      chip(certGbn === opt.value),
                    ].join(' ')}
                  >
                    <div>{opt.label}</div>
                    <div className="mt-0.5 text-[11px] font-normal text-[#7A7F8A]">{opt.hint}</div>
                  </button>
                ))}
              </div>
            </section>

            {step === 'error' && (
              <p className="rounded-[14px] bg-[#FFF4E5] px-4 py-3 text-[13px] text-[#C45C00]">{errorMsg}</p>
            )}

            <button
              type="button"
              onClick={buildRoutine}
              className="min-h-12 w-full rounded-[16px] bg-[#2F6BFF] text-[15px] font-bold text-white shadow-sm transition active:scale-[0.99]"
            >
              추천 루틴 만들기
            </button>
          </>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-[#7A7F8A]">
            <div className="size-8 animate-spin rounded-full border-4 border-[#E8EAF0] border-t-[#2F6BFF]" />
            <p className="text-sm">국민체력100 참고 데이터를 찾고 있어요…</p>
          </div>
        )}

        {step === 'result' && (
          <>
            <section className="rounded-[18px] border border-[#E8EAF0] bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-[#111111]">오늘의 추천 루틴</h2>
              {sourceInfo && (
                <p className="mt-1 text-[11px] text-[#7A7F8A]">
                  참고: {sourceInfo.ageClass}대 · {sourceInfo.certGbn} 구간
                  {sourceInfo.testYm ? ` · ${sourceInfo.testYm.slice(0, 4)}.${sourceInfo.testYm.slice(4)} 측정` : ''}
                </p>
              )}
              <ol className="mt-3 space-y-2">
                {exercises.map((ex, i) => (
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
                각 동작 30초 · 휴식 10초로 진행돼요. 국민체력100 공식 참고 통계이며 개인별 운동처방이 아니니,
                무리되면 언제든 멈춰도 좋아요.
              </p>
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
          </>
        )}
      </div>
    </PageShell>
  )
}
