import { create } from 'zustand'
import type { TransportState } from '@/types'

interface TransportStore extends TransportState {
  // Actions
  play: () => void
  pause: () => void
  stop: () => void
  togglePlayPause: () => void
  setCurrentTime: (time: number) => void
  seek: (time: number) => void
  setLoop: (start: number, end: number) => void
  toggleLoop: () => void
  disableLoop: () => void
  startRecording: () => void
  stopRecording: () => void
  goToStart: () => void
  goToEnd: (duration: number) => void
  nudgeTime: (delta: number) => void
}

export const useTransportStore = create<TransportStore>((set, get) => ({
  isPlaying: false,
  isRecording: false,
  currentTime: 0,
  loopEnabled: false,
  loopStart: 0,
  loopEnd: 0,

  play: () => set({ isPlaying: true }),

  pause: () => set({ isPlaying: false }),

  stop: () => set({ isPlaying: false, isRecording: false, currentTime: 0 }),

  togglePlayPause: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setCurrentTime: (time) => set({ currentTime: Math.max(0, time) }),

  seek: (time) => {
    const newTime = Math.max(0, time)
    set({ currentTime: newTime })
  },

  setLoop: (start, end) => {
    if (start < end) {
      set({ loopStart: start, loopEnd: end, loopEnabled: true })
    }
  },

  toggleLoop: () => set((state) => ({ loopEnabled: !state.loopEnabled })),

  disableLoop: () => set({ loopEnabled: false }),

  startRecording: () => {
    const state = get()
    set({ isRecording: true, isPlaying: true })
    if (!state.isPlaying) {
      // Start from current position
    }
  },

  stopRecording: () => set({ isRecording: false }),

  goToStart: () => set({ currentTime: 0 }),

  goToEnd: (duration) => set({ currentTime: duration }),

  nudgeTime: (delta) => {
    set((state) => ({
      currentTime: Math.max(0, state.currentTime + delta),
    }))
  },
}))
