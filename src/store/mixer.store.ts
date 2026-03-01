import { create } from 'zustand'
import type { MixerState } from '@/types'

interface MixerStore extends MixerState {
  // Actions
  setMasterVolume: (volume: number) => void
  toggleMasterMute: () => void
}

export const useMixerStore = create<MixerStore>((set) => ({
  masterVolume: 0.8,
  masterMuted: false,

  setMasterVolume: (volume) => {
    set({ masterVolume: Math.max(0, Math.min(1, volume)) })
  },

  toggleMasterMute: () => {
    set((state) => ({ masterMuted: !state.masterMuted }))
  },
}))
