const units = [
  '',
  '하나',
  '둘',
  '셋',
  '넷',
  '다섯',
  '여섯',
  '일곱',
  '여덟',
  '아홉',
]

const tens = ['', '열', '스물', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔']

/** 1~99 범위의 한국어 고유어 수사 (운동 카운트용) */
export function toKoreanCount(n: number): string {
  if (n <= 0) return String(n)
  if (n < 10) return units[n]
  if (n === 10) return '열'
  if (n < 100) {
    const t = Math.floor(n / 10)
    const u = n % 10
    const tenPart = tens[t]
    const unitPart = u > 0 ? units[u] : ''
    return `${tenPart}${unitPart}`
  }
  return String(n)
}

