/**
 * 국민체력100 체력인증센터 측정결과 정보 — 서버리스 프록시
 *
 * data.go.kr 인증키(serviceKey)를 클라이언트 번들에 노출하지 않기 위해,
 * 브라우저는 이 함수만 호출하고 실제 apis.data.go.kr 호출은 서버(Vercel Function)에서 수행한다.
 * 인증키는 KSPO_API_KEY_ENCODED 환경변수로만 서버에 보관되며 클라이언트로 전달되지 않는다.
 */

const ALLOWED_PARAMS = ['pageNo', 'numOfRows', 'age_class', 'test_sex', 'cert_gbn']

export default async function handler(req: any, res: any) {
  const endpoint = process.env.KSPO_FITNESS100_ENDPOINT
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
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    res.status(upstream.status).send(text)
  } catch {
    res.status(502).json({ error: '국민체력100 API 호출에 실패했어요.' })
  }
}
