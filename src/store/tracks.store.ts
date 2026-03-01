import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Track, Clip, TrackColor } from '@/types'

interface TracksStore {
  tracks: Track[]
  selectedTrackId: string | null
  selectedClipIds: string[]

  // Track Actions
  addTrack: (name?: string) => string
  removeTrack: (trackId: string) => void
  updateTrack: (trackId: string, updates: Partial<Track>) => void
  setTrackVolume: (trackId: string, volume: number) => void
  setTrackPan: (trackId: string, pan: number) => void
  toggleTrackMute: (trackId: string) => void
  toggleTrackSolo: (trackId: string) => void
  toggleTrackArmed: (trackId: string) => void
  reorderTracks: (fromIndex: number, toIndex: number) => void

  // Clip Actions
  addClip: (trackId: string, clip: Omit<Clip, 'id' | 'trackId'>) => string
  removeClip: (clipId: string) => void
  updateClip: (clipId: string, updates: Partial<Clip>) => void
  moveClip: (clipId: string, newTrackId: string, newStartTime: number) => void
  duplicateClip: (clipId: string) => string | null

  // Selection
  selectTrack: (trackId: string | null) => void
  selectClip: (clipId: string, addToSelection?: boolean) => void
  selectClips: (clipIds: string[]) => void
  deselectAllClips: () => void
  deleteSelectedClips: () => void

  // Helpers
  getTrackById: (trackId: string) => Track | undefined
  getClipById: (clipId: string) => Clip | undefined
  getClipsForTrack: (trackId: string) => Clip[]
  getProjectDuration: () => number
}

const TRACK_COLORS: TrackColor[] = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'pink']

export const useTracksStore = create<TracksStore>((set, get) => ({
  tracks: [],
  selectedTrackId: null,
  selectedClipIds: [],

  // Track Actions
  addTrack: (name) => {
    const id = uuidv4()
    const trackCount = get().tracks.length
    const color = TRACK_COLORS[trackCount % TRACK_COLORS.length]

    const track: Track = {
      id,
      name: name || `Track ${trackCount + 1}`,
      color,
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      armed: false,
      clips: [],
    }

    set((state) => ({
      tracks: [...state.tracks, track],
      selectedTrackId: id,
    }))

    return id
  },

  removeTrack: (trackId) => {
    set((state) => ({
      tracks: state.tracks.filter((t) => t.id !== trackId),
      selectedTrackId: state.selectedTrackId === trackId ? null : state.selectedTrackId,
      selectedClipIds: state.selectedClipIds.filter(
        (clipId) => !state.tracks.find((t) => t.id === trackId)?.clips.some((c) => c.id === clipId)
      ),
    }))
  },

  updateTrack: (trackId, updates) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, ...updates } : t
      ),
    }))
  },

  setTrackVolume: (trackId, volume) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, volume: Math.max(0, Math.min(1, volume)) } : t
      ),
    }))
  },

  setTrackPan: (trackId, pan) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, pan: Math.max(-1, Math.min(1, pan)) } : t
      ),
    }))
  },

  toggleTrackMute: (trackId) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, muted: !t.muted } : t
      ),
    }))
  },

  toggleTrackSolo: (trackId) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, solo: !t.solo } : t
      ),
    }))
  },

  toggleTrackArmed: (trackId) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, armed: !t.armed } : t
      ),
    }))
  },

  reorderTracks: (fromIndex, toIndex) => {
    set((state) => {
      const newTracks = [...state.tracks]
      const [removed] = newTracks.splice(fromIndex, 1)
      newTracks.splice(toIndex, 0, removed)
      return { tracks: newTracks }
    })
  },

  // Clip Actions
  addClip: (trackId, clipData) => {
    const clipId = uuidv4()
    const clip: Clip = {
      ...clipData,
      id: clipId,
      trackId,
    }

    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, clips: [...t.clips, clip] } : t
      ),
    }))

    return clipId
  },

  removeClip: (clipId) => {
    set((state) => ({
      tracks: state.tracks.map((t) => ({
        ...t,
        clips: t.clips.filter((c) => c.id !== clipId),
      })),
      selectedClipIds: state.selectedClipIds.filter((id) => id !== clipId),
    }))
  },

  updateClip: (clipId, updates) => {
    set((state) => ({
      tracks: state.tracks.map((t) => ({
        ...t,
        clips: t.clips.map((c) =>
          c.id === clipId ? { ...c, ...updates } : c
        ),
      })),
    }))
  },

  moveClip: (clipId, newTrackId, newStartTime) => {
    const state = get()
    let clipToMove: Clip | undefined

    // Find the clip
    for (const track of state.tracks) {
      const clip = track.clips.find((c) => c.id === clipId)
      if (clip) {
        clipToMove = clip
        break
      }
    }

    if (!clipToMove) return

    set((state) => ({
      tracks: state.tracks.map((t) => {
        // Remove from old track
        const clipsWithoutMoved = t.clips.filter((c) => c.id !== clipId)

        // Add to new track
        if (t.id === newTrackId && clipToMove) {
          return {
            ...t,
            clips: [
              ...clipsWithoutMoved,
              { ...clipToMove, trackId: newTrackId, startTime: newStartTime },
            ],
          }
        }

        return { ...t, clips: clipsWithoutMoved }
      }),
    }))
  },

  duplicateClip: (clipId) => {
    const state = get()
    let originalClip: Clip | undefined
    let trackId: string | undefined

    for (const track of state.tracks) {
      const clip = track.clips.find((c) => c.id === clipId)
      if (clip) {
        originalClip = clip
        trackId = track.id
        break
      }
    }

    if (!originalClip || !trackId) return null

    const newClipId = uuidv4()
    const newClip: Clip = {
      ...originalClip,
      id: newClipId,
      startTime: originalClip.startTime + originalClip.duration,
    }

    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, clips: [...t.clips, newClip] } : t
      ),
      selectedClipIds: [newClipId],
    }))

    return newClipId
  },

  // Selection
  selectTrack: (trackId) => set({ selectedTrackId: trackId }),

  selectClip: (clipId, addToSelection = false) => {
    set((state) => ({
      selectedClipIds: addToSelection
        ? state.selectedClipIds.includes(clipId)
          ? state.selectedClipIds.filter((id) => id !== clipId)
          : [...state.selectedClipIds, clipId]
        : [clipId],
    }))
  },

  selectClips: (clipIds) => set({ selectedClipIds: clipIds }),

  deselectAllClips: () => set({ selectedClipIds: [] }),

  deleteSelectedClips: () => {
    const { selectedClipIds } = get()
    set((state) => ({
      tracks: state.tracks.map((t) => ({
        ...t,
        clips: t.clips.filter((c) => !selectedClipIds.includes(c.id)),
      })),
      selectedClipIds: [],
    }))
  },

  // Helpers
  getTrackById: (trackId) => get().tracks.find((t) => t.id === trackId),

  getClipById: (clipId) => {
    for (const track of get().tracks) {
      const clip = track.clips.find((c) => c.id === clipId)
      if (clip) return clip
    }
    return undefined
  },

  getClipsForTrack: (trackId) => {
    const track = get().tracks.find((t) => t.id === trackId)
    return track?.clips || []
  },

  getProjectDuration: () => {
    let maxEnd = 0
    for (const track of get().tracks) {
      for (const clip of track.clips) {
        const clipEnd = clip.startTime + clip.duration
        if (clipEnd > maxEnd) maxEnd = clipEnd
      }
    }
    return maxEnd
  },
}))
