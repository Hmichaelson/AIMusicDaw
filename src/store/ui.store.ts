import { create } from 'zustand'
import type { UIState } from '@/types'
import {
  DEFAULT_SIDEBAR_WIDTH,
  DEFAULT_MIXER_HEIGHT,
  DEFAULT_ZOOM,
  MIN_ZOOM,
  MAX_ZOOM,
} from '@/config/constants'

interface UIStore extends UIState {
  // Sidebar
  setSidebarWidth: (width: number) => void

  // Mixer
  setMixerHeight: (height: number) => void
  toggleMixerCollapsed: () => void

  // Timeline
  setTimelineZoom: (zoom: number) => void
  zoomIn: () => void
  zoomOut: () => void
  setTimelineScrollX: (scrollX: number) => void

  // Selection (mirrors tracks store for convenience)
  setSelectedTrackId: (trackId: string | null) => void
  setSelectedClipIds: (clipIds: string[]) => void

  // Modals
  showShortcutsModal: boolean
  showExportModal: boolean
  showImportModal: boolean
  showSettingsModal: boolean
  setShowShortcutsModal: (show: boolean) => void
  setShowExportModal: (show: boolean) => void
  setShowImportModal: (show: boolean) => void
  setShowSettingsModal: (show: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
  mixerHeight: DEFAULT_MIXER_HEIGHT,
  mixerCollapsed: false,
  timelineZoom: DEFAULT_ZOOM,
  timelineScrollX: 0,
  selectedTrackId: null,
  selectedClipIds: [],

  // Modal states
  showShortcutsModal: false,
  showExportModal: false,
  showImportModal: false,
  showSettingsModal: false,

  setSidebarWidth: (width) => set({ sidebarWidth: width }),

  setMixerHeight: (height) => set({ mixerHeight: height }),

  toggleMixerCollapsed: () =>
    set((state) => ({ mixerCollapsed: !state.mixerCollapsed })),

  setTimelineZoom: (zoom) =>
    set({ timelineZoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom)) }),

  zoomIn: () =>
    set((state) => ({
      timelineZoom: Math.min(MAX_ZOOM, state.timelineZoom * 1.2),
    })),

  zoomOut: () =>
    set((state) => ({
      timelineZoom: Math.max(MIN_ZOOM, state.timelineZoom / 1.2),
    })),

  setTimelineScrollX: (scrollX) => set({ timelineScrollX: Math.max(0, scrollX) }),

  setSelectedTrackId: (trackId) => set({ selectedTrackId: trackId }),

  setSelectedClipIds: (clipIds) => set({ selectedClipIds: clipIds }),

  setShowShortcutsModal: (show) => set({ showShortcutsModal: show }),

  setShowExportModal: (show) => set({ showExportModal: show }),

  setShowImportModal: (show) => set({ showImportModal: show }),

  setShowSettingsModal: (show) => set({ showSettingsModal: show }),
}))
