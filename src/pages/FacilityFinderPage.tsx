import { useState } from 'react'
import { PageShell } from '../components/PageShell'
import { fetchFacilities, type FacilityRecord } from '../services/kspoApi'

const SIDO_OPTIONS = [
  '서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시',
  '대전광역시', '울산광역시', '세종특별자치시', '경기도', '강원특별자치도',
  '충청북도', '충청남도', '전북특별자치도', '전라남도', '경상북도',
  '경상남도', '제주특별자치도',
]

type Step = 'form' | 'loading' | 'result' | 'error'

export default function FacilityFinderPage() {
  const [sidoNm, setSidoNm] = useState('')
  const [sigunguNm, setSigunguNm] = useState('')
  const [faciTypeNm, setFaciTypeNm] = useState('')
  const [step, setStep] = useState<Step>('form')
  const [facilities, setFacilities] = useState<FacilityRecord[]>([])
  const [errorMsg, setErrorMsg] = useState('')

  const search = async () => {
    setStep('loading')
    setErrorMsg('')
    try {
      const results = await fetchFacilities({
        sidoNm: sidoNm || undefined,
        sigunguNm: sigunguNm.trim() || undefined,
        faciTypeNm: faciTypeNm.trim() || undefined,
        numOfRows: 30,
      })
      if (results.length === 0) {
        setStep('error')
        setErrorMsg('조건에 맞는 공공체육시설을 찾지 못했어요. 검색 범위를 넓혀서 다시 시도해 보세요.')
        return
      }
      setFacilities(results)
      setStep('result')
    } catch (e) {
      setStep('error')
      setErrorMsg('공공체육시설 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')
      console.error(e)
    }
  }

  return (
    <PageShell title="주변 공공체육시설 찾기">
      <div className="space-y-6 text-[#111111]">
        <p className="text-[13px] leading-relaxed text-[#7A7F8A]">
          국민체육진흥공단이 공개한 전국 공공체육시설 데이터에서 운동할 곳을 찾아보세요.
          오늘의 루틴을 집이 아니라 동네 체육시설에서 이어가고 싶을 때 활용해 보세요.
        </p>

        {(step === 'form' || step === 'error' || step === 'loading') && (
          <>
            <section className="rounded-[18px] border border-[#E8EAF0] bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-[#111111]">시/도</h2>
              <select
                value={sidoNm}
                onChange={(e) => setSidoNm(e.target.value)}
                className="mt-3 min-h-11 w-full rounded-[14px] border border-[#E8EAF0] bg-white px-3 text-sm font-medium text-[#111111]"
              >
                <option value="">전체</option>
                {SIDO_OPTIONS.map((sido) => (
                  <option key={sido} value={sido}>
                    {sido}
                  </option>
                ))}
              </select>
            </section>

            <section className="rounded-[18px] border border-[#E8EAF0] bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-[#111111]">시/군/구 (선택)</h2>
              <input
                value={sigunguNm}
                onChange={(e) => setSigunguNm(e.target.value)}
                placeholder="예: 화성시, 강남구"
                className="mt-3 min-h-11 w-full rounded-[14px] border border-[#E8EAF0] bg-white px-3 text-sm font-medium text-[#111111] placeholder:text-[#B3B8C2]"
              />
            </section>

            <section className="rounded-[18px] border border-[#E8EAF0] bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-[#111111]">시설 유형 (선택)</h2>
              <input
                value={faciTypeNm}
                onChange={(e) => setFaciTypeNm(e.target.value)}
                placeholder="예: 축구장, 체육관, 테니스장"
                className="mt-3 min-h-11 w-full rounded-[14px] border border-[#E8EAF0] bg-white px-3 text-sm font-medium text-[#111111] placeholder:text-[#B3B8C2]"
              />
            </section>

            {step === 'error' && (
              <p className="rounded-[14px] bg-[#FFF4E5] px-4 py-3 text-[13px] text-[#C45C00]">{errorMsg}</p>
            )}

            <button
              type="button"
              onClick={search}
              disabled={step === 'loading'}
              className="min-h-12 w-full rounded-[16px] bg-[#2F6BFF] text-[15px] font-bold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60"
            >
              {step === 'loading' ? '찾는 중…' : '시설 찾기'}
            </button>
          </>
        )}

        {step === 'result' && (
          <>
            <section className="rounded-[18px] border border-[#E8EAF0] bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-[#111111]">
                검색 결과 {facilities.length}건
              </h2>
              <ul className="mt-3 space-y-2">
                {facilities.map((f, i) => (
                  <li
                    key={`${f.faci_nm}-${i}`}
                    className="rounded-[12px] bg-[#F5F7FA] px-3 py-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[14px] font-bold text-[#111111]">{f.faci_nm}</p>
                      {f.ftype_nm && (
                        <span className="shrink-0 rounded-full bg-[#EAF1FF] px-2 py-0.5 text-[11px] font-semibold text-[#2F6BFF]">
                          {f.ftype_nm}
                        </span>
                      )}
                    </div>
                    {(f.faci_road_addr || f.fmng_cp_nm) && (
                      <p className="mt-1 text-[12px] text-[#7A7F8A]">
                        {f.faci_road_addr || `${f.fmng_cp_nm ?? ''} ${f.fmng_cpb_nm ?? ''}`.trim()}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] leading-relaxed text-[#7A7F8A]">
                국민체육진흥공단 공공체육시설 데이터 기준이며, 실제 운영 여부·이용 가능 시간은
                방문 전 시설에 직접 확인해 주세요.
              </p>
            </section>

            <button
              type="button"
              onClick={() => setStep('form')}
              className="min-h-12 w-full rounded-[16px] border border-[#E8EAF0] bg-white text-[14px] font-bold text-[#111111]"
            >
              다시 검색
            </button>
          </>
        )}
      </div>
    </PageShell>
  )
}
