import type { PresetCategory } from '../types'

/** Pro 구독 없이는 프리셋·카테고리 진입 불가 */
const PRO_ONLY: ReadonlySet<PresetCategory> = new Set(['brushing', 'sleep', 'asmr'])

export function isProOnlyPresetCategory(category: PresetCategory): boolean {
  return PRO_ONLY.has(category)
}
