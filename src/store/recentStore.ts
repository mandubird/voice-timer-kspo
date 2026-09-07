import { create } from 'zustand'

const STORAGE_KEY = 'voice_timer_recent_presets'
const MAX_RECENT = 3

function loadRecent(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : []
  } catch {
    return []
  }
}

function saveRecent(ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch { /* ignore */ }
}

interface RecentStoreState {
  recentIds: string[]
  addRecent: (id: string) => void
  clearRecent: () => void
}

export const useRecentStore = create<RecentStoreState>((set, get) => ({
  recentIds: loadRecent(),

  addRecent: (id) => {
    const prev = get().recentIds.filter((x) => x !== id)
    const next = [id, ...prev].slice(0, MAX_RECENT)
    set({ recentIds: next })
    saveRecent(next)
  },

  clearRecent: () => {
    set({ recentIds: [] })
    saveRecent([])
  },
}))
