// Core type definitions for AI Music DAW

// ============================================
// Project Types
// ============================================

export interface Project {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
  sampleRate: number // 44100 or 48000
  bpm: number
  timeSignature: [number, number] // e.g., [4, 4]
}

// ============================================
// Track Types
// ============================================

export interface Track {
  id: string
  name: string
  color: TrackColor
  volume: number // 0 to 1
  pan: number // -1 to 1
  muted: boolean
  solo: boolean
  armed: boolean // Recording armed
  clips: Clip[]
}

export type TrackColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'cyan'
  | 'blue'
  | 'purple'
  | 'pink'

export const TRACK_COLORS: Record<TrackColor, string> = {
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  cyan: '#06b6d4',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  pink: '#ec4899',
}

// ============================================
// Clip Types
// ============================================

export interface Clip {
  id: string
  trackId: string
  name: string
  audioUrl: string // URL or blob URL for the audio
  startTime: number // Position in seconds on timeline
  duration: number // Length in seconds
  offset: number // Start offset within the audio file
  fadeIn: number // Fade in duration in seconds
  fadeOut: number // Fade out duration in seconds
  gain: number // Clip-level volume (0 to 1)
  waveformData?: number[] // Cached waveform peaks
}

// ============================================
// Transport Types
// ============================================

export interface TransportState {
  isPlaying: boolean
  isRecording: boolean
  currentTime: number // Playhead position in seconds
  loopEnabled: boolean
  loopStart: number
  loopEnd: number
}

// ============================================
// Mixer Types
// ============================================

export interface MixerState {
  masterVolume: number // 0 to 1
  masterMuted: boolean
}

// ============================================
// AI Generation Types
// ============================================

export type AIProvider = 'suno' | 'udio' | 'stable-audio'

export interface GenerationSettings {
  duration?: number // Target duration in seconds
  instrumental?: boolean // No vocals
  style?: string // Genre/style hints
  provider: AIProvider
}

export type GenerationStatus =
  | 'pending'
  | 'generating'
  | 'completed'
  | 'failed'

export interface AIGenerationJob {
  id: string
  status: GenerationStatus
  prompt: string
  settings: GenerationSettings
  result?: {
    audioUrl: string
    duration: number
    title?: string
  }
  error?: string
  createdAt: Date
  progress?: number // 0 to 100
}

export type StemType = 'vocals' | 'drums' | 'bass' | 'other' | 'piano' | 'guitar'

export interface StemResult {
  type: StemType
  audioUrl: string
  duration: number
}

export interface StemSeparationJob {
  id: string
  status: GenerationStatus
  sourceAudioUrl: string
  results?: StemResult[]
  error?: string
  createdAt: Date
  progress?: number
}

// ============================================
// UI Types
// ============================================

export interface UIState {
  sidebarWidth: number
  mixerHeight: number
  mixerCollapsed: boolean
  timelineZoom: number // pixels per second
  timelineScrollX: number
  selectedTrackId: string | null
  selectedClipIds: string[]
}

// ============================================
// Audio Types
// ============================================

export interface AudioFileInfo {
  name: string
  duration: number
  sampleRate: number
  channels: number
  url: string
}

// ============================================
// Keyboard Shortcuts
// ============================================

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  action: string
  description: string
}
