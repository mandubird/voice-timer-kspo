/**
 * 서울올림픽기념국민체육진흥공단 공공데이터 API 연동
 * - 국민체력100 체력인증센터 측정결과 정보 (SRVC_NFA_TEST_RESULT)
 * - 공공체육시설 상세 정보_GW (SRVC_SFMS_FACIL_INFO)
 *
 * 인증키(serviceKey)는 클라이언트에 절대 내려보내지 않는다.
 * 브라우저는 같은 도메인의 /api/kspo-fitness, /api/kspo-facility (Vercel 서버리스 함수)만
 * 호출하고, 실제 apis.data.go.kr 요청과 인증키 사용은 서버에서만 이루어진다.
 * (api/kspo-fitness.ts, api/kspo-facility.ts 참고)
 */

/** 국민체력100 측정결과 레코드 (item_f001~052는 공식 필드 정의가 비공개라 원본 그대로 보존) */
export interface Fitness100Record {
  row_num: string
  age_class: string
  age_degree: string
  age_gbn: string
  cert_gbn: string
  test_sex: string
  test_ym: string
  pres_note?: string
  [key: string]: string | undefined
}

export interface FacilityRecord {
  faci_nm: string // 시설명
  ftype_nm: string // 시설유형명
  fcob_nm?: string // 업종명
  faci_gb_nm?: string // 국가/공공 구분
  fmng_cp_nm?: string // 소유주체시도명
  fmng_cpb_nm?: string // 소유주체시군구명
  addr_ctpv_nm?: string // 주소 시도명
  addr_cpb_nm?: string // 주소 시군구명
  faci_road_addr?: string // 도로명주소
  faci_lot?: string // 좌표경도
  faci_lat?: string // 좌표위도
  faci_gfa?: number // 시설총면적
  faci_homepage?: string
  nation_yn?: string // 국가체육시설여부
  faci_stat_cd?: string // 시설상태 코드 (의미는 별도 코드표 확인 필요)
  [key: string]: string | number | undefined
}

/** data.go.kr 응답의 공통 껍데기 (최상위 "response" 키로 한 번 더 감싸져 있음) */
interface OpenApiResponse<T> {
  response: {
    header: { resultCode: string; resultMsg: string }
    body: {
      pageNo: string
      totalCount: string
      numOfRows: string
      items: { item: T[] | T } | ''
    }
  }
}

async function callProxy<T>(
  proxyPath: '/api/kspo-fitness' | '/api/kspo-facility',
  params: Record<string, string | number | undefined>,
): Promise<T[]> {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&')
  const res = await fetch(`${proxyPath}?${qs}`)
  if (!res.ok) throw new Error(`KSPO API 호출 실패: ${res.status}`)
  const data: OpenApiResponse<T> = await res.json()
  const header = data.response?.header
  if (header?.resultCode !== '00') {
    throw new Error(`KSPO API 오류: ${header?.resultMsg ?? '알 수 없는 오류'}`)
  }
  const items = data.response?.body?.items
  if (!items) return []
  return Array.isArray(items.item) ? items.item : items.item ? [items.item] : []
}

export interface FitnessQuery {
  ageClass?: string // '20' | '30' | '40' | '50' | '60' | '70' 등 (연대 단위로 추정)
  sex?: 'M' | 'F'
  certGbn?: string // '참가' | '3등급' 등 — 정확한 전체 코드표는 미확인
  numOfRows?: number
}

/**
 * 국민체력100 측정결과 샘플을 가져온다.
 * 서버측 필터(age_class/test_sex/cert_gbn)가 항상 정확히 동작한다는 보장이 없어,
 * 넉넉히 받아온 뒤 클라이언트에서 다시 한 번 필터링한다.
 */
export async function fetchFitness100Sample(query: FitnessQuery): Promise<Fitness100Record[]> {
  const raw = await callProxy<Fitness100Record>('/api/kspo-fitness', {
    pageNo: 1,
    numOfRows: query.numOfRows ?? 100,
    age_class: query.ageClass,
    test_sex: query.sex,
    cert_gbn: query.certGbn,
  })

  // 클라이언트 재필터링 (서버 필터가 안 먹었을 경우를 대비)
  // API 응답의 age_class는 숫자(JSON number)로 오는 경우가 있어 문자열로 맞춰 비교한다.
  let filtered = raw
  if (query.ageClass) filtered = filtered.filter((r) => String(r.age_class) === String(query.ageClass))
  if (query.sex) filtered = filtered.filter((r) => r.test_sex === query.sex)
  if (query.certGbn) filtered = filtered.filter((r) => r.cert_gbn === query.certGbn)

  return filtered.length > 0 ? filtered : raw
}

/** pres_note("본운동:스트레칭A,스트레칭B,...")를 운동 이름 배열로 변환 */
export function parsePresNote(note?: string): string[] {
  if (!note) return []
  const body = note.includes(':') ? note.split(':').slice(1).join(':') : note
  return body
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export interface FacilityQuery {
  sidoNm?: string // 소유주체시도명 (fmng_cp_nm)
  sigunguNm?: string // 소유주체시군구명 (fmng_cpb_nm)
  faciTypeNm?: string // 시설유형명 (ftype_nm)
  faciNm?: string // 시설명 (faci_nm)
  numOfRows?: number
}

export async function fetchFacilities(query: FacilityQuery): Promise<FacilityRecord[]> {
  return callProxy<FacilityRecord>('/api/kspo-facility', {
    pageNo: 1,
    numOfRows: query.numOfRows ?? 30,
    fmng_cp_nm: query.sidoNm,
    fmng_cpb_nm: query.sigunguNm,
    ftype_nm: query.faciTypeNm,
    faci_nm: query.faciNm,
  })
}
