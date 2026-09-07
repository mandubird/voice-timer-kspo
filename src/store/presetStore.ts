import { create } from 'zustand'

/** Step 6에서 기본 프리셋·커스텀 연동 */
interface PresetStoreState {
  hydrated: boolean
  setHydrated: (v: boolean) => void
}

export const usePresetStore = create<PresetStoreState>((set) => ({
  hydrated: false,
  setHydrated: (hydrated) => set({ hydrated }),
}))
