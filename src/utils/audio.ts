// Audio utility functions

/**
 * Convert linear gain (0-1) to decibels
 */
export function gainToDb(gain: number): number {
  if (gain <= 0) return -Infinity
  return 20 * Math.log10(gain)
}

/**
 * Convert decibels to linear gain (0-1)
 */
export function dbToGain(db: number): number {
  if (db === -Infinity) return 0
  return Math.pow(10, db / 20)
}

/**
 * Format decibel value for display
 */
export function formatDb(db: number): string {
  if (db === -Infinity) return '-∞'
  if (db >= 0) return `+${db.toFixed(1)}`
  return db.toFixed(1)
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Linear interpolation
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Extract waveform peaks from AudioBuffer
 */
export function extractWaveformPeaks(
  audioBuffer: AudioBuffer,
  samplesPerPixel: number
): number[] {
  const channelData = audioBuffer.getChannelData(0)
  const peaks: number[] = []

  for (let i = 0; i < channelData.length; i += samplesPerPixel) {
    let max = 0
    const end = Math.min(i + samplesPerPixel, channelData.length)

    for (let j = i; j < end; j++) {
      const abs = Math.abs(channelData[j])
      if (abs > max) max = abs
    }

    peaks.push(max)
  }

  return peaks
}

/**
 * Create a silent AudioBuffer
 */
export function createSilentBuffer(
  context: AudioContext,
  duration: number,
  channels: number = 2
): AudioBuffer {
  const sampleRate = context.sampleRate
  const frameCount = Math.ceil(duration * sampleRate)
  return context.createBuffer(channels, frameCount, sampleRate)
}

/**
 * Concatenate multiple AudioBuffers
 */
export function concatenateBuffers(
  context: AudioContext,
  buffers: AudioBuffer[]
): AudioBuffer {
  if (buffers.length === 0) {
    return createSilentBuffer(context, 0)
  }

  const channels = buffers[0].numberOfChannels
  const totalLength = buffers.reduce((sum, b) => sum + b.length, 0)
  const result = context.createBuffer(channels, totalLength, context.sampleRate)

  let offset = 0
  for (const buffer of buffers) {
    for (let channel = 0; channel < channels; channel++) {
      result.getChannelData(channel).set(
        buffer.getChannelData(Math.min(channel, buffer.numberOfChannels - 1)),
        offset
      )
    }
    offset += buffer.length
  }

  return result
}

/**
 * Get audio file duration without fully decoding
 */
export async function getAudioDuration(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio()
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration)
    })
    audio.addEventListener('error', () => {
      reject(new Error('Failed to load audio'))
    })
    audio.src = url
  })
}

/**
 * Decode audio file to AudioBuffer
 */
export async function decodeAudioFile(
  file: File,
  context: AudioContext
): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer()
  return context.decodeAudioData(arrayBuffer)
}

/**
 * Load audio from URL to AudioBuffer
 */
export async function loadAudioFromUrl(
  url: string,
  context: AudioContext | OfflineAudioContext
): Promise<AudioBuffer> {
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  return context.decodeAudioData(arrayBuffer)
}

/**
 * Convert AudioBuffer to WAV Blob
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const format = 1 // PCM
  const bitDepth = 16

  const bytesPerSample = bitDepth / 8
  const blockAlign = numChannels * bytesPerSample

  // Interleave channels
  const length = buffer.length * numChannels
  const interleaved = new Float32Array(length)

  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      interleaved[i * numChannels + channel] = buffer.getChannelData(channel)[i]
    }
  }

  const dataLength = interleaved.length * bytesPerSample
  const wavBuffer = new ArrayBuffer(44 + dataLength)
  const view = new DataView(wavBuffer)

  // WAV header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // fmt chunk size
  view.setUint16(20, format, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)
  writeString(view, 36, 'data')
  view.setUint32(40, dataLength, true)

  // Write audio data
  let offset = 44
  for (let i = 0; i < interleaved.length; i++) {
    const sample = Math.max(-1, Math.min(1, interleaved[i]))
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff
    view.setInt16(offset, intSample, true)
    offset += 2
  }

  return new Blob([wavBuffer], { type: 'audio/wav' })
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}

/**
 * Generate a unique color for a track based on index
 */
export function getTrackColor(index: number): string {
  const colors = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
  ]
  return colors[index % colors.length]
}
