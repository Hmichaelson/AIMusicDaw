// Time and position utility functions

/**
 * Format seconds to MM:SS.mmm display
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)

  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
}

/**
 * Format seconds to MM:SS display (no milliseconds)
 */
export function formatTimeShort(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)

  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Convert bars/beats to seconds
 */
export function barsToSeconds(
  bars: number,
  beats: number,
  bpm: number,
  timeSignature: [number, number] = [4, 4]
): number {
  const beatsPerBar = timeSignature[0]
  const totalBeats = bars * beatsPerBar + beats
  const secondsPerBeat = 60 / bpm
  return totalBeats * secondsPerBeat
}

/**
 * Convert seconds to bars/beats
 */
export function secondsToBars(
  seconds: number,
  bpm: number,
  timeSignature: [number, number] = [4, 4]
): { bars: number; beats: number; ticks: number } {
  const beatsPerBar = timeSignature[0]
  const secondsPerBeat = 60 / bpm
  const totalBeats = seconds / secondsPerBeat

  const bars = Math.floor(totalBeats / beatsPerBar)
  const remainingBeats = totalBeats % beatsPerBar
  const beats = Math.floor(remainingBeats)
  const ticks = Math.floor((remainingBeats % 1) * 960) // 960 ticks per beat (standard MIDI)

  return { bars, beats, ticks }
}

/**
 * Format position as bars:beats:ticks
 */
export function formatBarsBeats(
  seconds: number,
  bpm: number,
  timeSignature: [number, number] = [4, 4]
): string {
  const { bars, beats, ticks } = secondsToBars(seconds, bpm, timeSignature)
  return `${bars + 1}.${beats + 1}.${ticks.toString().padStart(3, '0')}`
}

/**
 * Convert pixel position to time based on zoom level
 */
export function pixelsToTime(pixels: number, pixelsPerSecond: number): number {
  return pixels / pixelsPerSecond
}

/**
 * Convert time to pixel position based on zoom level
 */
export function timeToPixels(seconds: number, pixelsPerSecond: number): number {
  return seconds * pixelsPerSecond
}

/**
 * Snap time to grid based on BPM and snap resolution
 */
export function snapToGrid(
  seconds: number,
  bpm: number,
  snapDivision: number = 4, // 4 = quarter note, 8 = eighth note, etc.
  timeSignature: [number, number] = [4, 4]
): number {
  const secondsPerBeat = 60 / bpm
  const snapInterval = secondsPerBeat / (snapDivision / timeSignature[1])
  return Math.round(seconds / snapInterval) * snapInterval
}

/**
 * Calculate BPM from tap intervals
 */
export function calculateBpmFromTaps(tapTimes: number[]): number | null {
  if (tapTimes.length < 2) return null

  const intervals: number[] = []
  for (let i = 1; i < tapTimes.length; i++) {
    intervals.push(tapTimes[i] - tapTimes[i - 1])
  }

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
  return Math.round(60000 / avgInterval) // Convert ms interval to BPM
}

/**
 * Get time ruler markers for a given range
 */
export function getTimeRulerMarkers(
  startTime: number,
  endTime: number,
  pixelsPerSecond: number,
  bpm: number,
  timeSignature: [number, number] = [4, 4]
): Array<{ time: number; label: string; major: boolean }> {
  const markers: Array<{ time: number; label: string; major: boolean }> = []
  const secondsPerBeat = 60 / bpm
  const secondsPerBar = secondsPerBeat * timeSignature[0]

  // Determine marker interval based on zoom level
  let interval: number
  let useBars = false

  if (pixelsPerSecond < 20) {
    interval = 10 // 10 second marks
  } else if (pixelsPerSecond < 50) {
    interval = secondsPerBar * 4 // 4 bar marks
    useBars = true
  } else if (pixelsPerSecond < 100) {
    interval = secondsPerBar // 1 bar marks
    useBars = true
  } else if (pixelsPerSecond < 200) {
    interval = secondsPerBeat // Beat marks
    useBars = true
  } else {
    interval = secondsPerBeat / 2 // Half beat marks
    useBars = true
  }

  const firstMarker = Math.floor(startTime / interval) * interval

  for (let time = firstMarker; time <= endTime; time += interval) {
    const isMajor = useBars
      ? Math.abs(time % secondsPerBar) < 0.001
      : Math.abs(time % 10) < 0.001

    const label = useBars
      ? formatBarsBeats(time, bpm, timeSignature).split('.')[0]
      : formatTimeShort(time)

    markers.push({ time, label, major: isMajor })
  }

  return markers
}
