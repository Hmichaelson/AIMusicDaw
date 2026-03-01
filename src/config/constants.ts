// Application constants

// Audio settings
export const DEFAULT_SAMPLE_RATE = 44100
export const DEFAULT_BPM = 120
export const DEFAULT_TIME_SIGNATURE: [number, number] = [4, 4]

// Timeline settings
export const DEFAULT_ZOOM = 100 // pixels per second
export const MIN_ZOOM = 10
export const MAX_ZOOM = 500
export const TRACK_HEIGHT = 80 // pixels
export const TRACK_HEADER_WIDTH = 200 // pixels
export const TIME_RULER_HEIGHT = 30 // pixels

// Mixer settings
export const DEFAULT_MIXER_HEIGHT = 150 // pixels
export const MIN_MIXER_HEIGHT = 100
export const MAX_MIXER_HEIGHT = 300

// Sidebar settings
export const DEFAULT_SIDEBAR_WIDTH = 300 // pixels
export const MIN_SIDEBAR_WIDTH = 250
export const MAX_SIDEBAR_WIDTH = 500

// Audio constraints
export const MAX_TRACKS = 32
export const MAX_CLIPS_PER_TRACK = 100
export const MAX_PROJECT_DURATION = 3600 // 1 hour in seconds

// AI Generation
export const MAX_GENERATION_DURATION = 300 // 5 minutes
export const DEFAULT_GENERATION_DURATION = 60 // 1 minute
export const GENERATION_POLL_INTERVAL = 3000 // 3 seconds

// UI
export const PLAYHEAD_UPDATE_INTERVAL = 50 // ms for smooth playhead animation
export const WAVEFORM_SAMPLES_PER_PIXEL = 100

// Storage keys
export const STORAGE_KEYS = {
  PROJECT: 'aimusicdaw_project',
  SETTINGS: 'aimusicdaw_settings',
  RECENT_PROJECTS: 'aimusicdaw_recent',
} as const

// Supported audio formats
export const SUPPORTED_AUDIO_FORMATS = [
  'audio/wav',
  'audio/mp3',
  'audio/mpeg',
  'audio/ogg',
  'audio/webm',
  'audio/aac',
  'audio/flac',
]

export const SUPPORTED_EXTENSIONS = [
  '.wav',
  '.mp3',
  '.ogg',
  '.webm',
  '.aac',
  '.flac',
  '.m4a',
]

// Track colors
export const TRACK_COLORS: Record<string, string> = {
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  cyan: '#06b6d4',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  pink: '#ec4899',
}
