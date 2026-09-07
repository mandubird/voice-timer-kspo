/**
 * 공공체육시설 상세 정보_GW — 서버리스 프록시
 * (kspo-fitness.ts와 동일한 이유로 인증키를 서버에서만 사용한다)
 */

const ALLOWED_PARAMS = ['pageNo', 'numOfRows', 'fmng_cp_nm', 'fmng_cpb_nm', 'ftype_nm', 'faci_nm']

export default async function handler(req: any, res: any) {
  const endpoint = process.env.KSPO_FACILITY_ENDPOINT
  const serviceKey = process.env.KSPO_API_KEY_ENCODED

  if (!endpoint || !serviceKey) {
    res.status(500).json({ error: '서버에 KSPO API 키가 설정되지 않았어요.' })
    return
  }

  const query = req.query ?? {}
  const params = new URLSearchParams()
  for (const key of ALLOWED_PARAMS) {
    const value = query[key]
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  params.set('resultType', 'json')

  const url = `${endpoint}?serviceKey=${serviceKey}&${params.toString()}`

  try {
    const upstream = await fetch(url)
    const text = await upstream.text()
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.status(upstream.status).send(text)
  } catch {
    res.status(502).json({ error: '공공체육시설 API 호출에 실패했어요.' })
  }
}
