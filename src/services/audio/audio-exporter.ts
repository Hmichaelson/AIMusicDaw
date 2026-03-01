import { audioBufferToWav } from '@/utils/audio'

/**
 * AudioExporter - Service for exporting audio to various formats
 */
class AudioExporter {
  /**
   * Export AudioBuffer to WAV
   */
  async exportWav(audioBuffer: AudioBuffer): Promise<Blob> {
    return audioBufferToWav(audioBuffer)
  }

  /**
   * Export AudioBuffer to MP3 (requires external library)
   * For now, we'll export as WAV since MP3 encoding requires lamejs
   */
  async exportMp3(audioBuffer: AudioBuffer): Promise<Blob> {
    // TODO: Implement MP3 encoding with lamejs
    // For now, fall back to WAV
    console.warn('MP3 export not yet implemented, exporting as WAV')
    return this.exportWav(audioBuffer)
  }

  /**
   * Download audio buffer as file
   */
  async downloadAudio(
    audioBuffer: AudioBuffer,
    filename: string,
    format: 'wav' | 'mp3' = 'wav'
  ): Promise<void> {
    let blob: Blob
    let extension: string

    if (format === 'mp3') {
      blob = await this.exportMp3(audioBuffer)
      extension = '.wav' // TODO: Change to .mp3 when implemented
    } else {
      blob = await this.exportWav(audioBuffer)
      extension = '.wav'
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename.endsWith(extension) ? filename : `${filename}${extension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * Mix multiple audio buffers into one
   */
  mixBuffers(
    context: AudioContext,
    buffers: Array<{ buffer: AudioBuffer; volume: number; pan: number; startTime: number }>
  ): AudioBuffer {
    // Find the total duration needed
    let maxDuration = 0
    for (const { buffer, startTime } of buffers) {
      const endTime = startTime + buffer.duration
      if (endTime > maxDuration) maxDuration = endTime
    }

    // Create output buffer
    const sampleRate = context.sampleRate
    const outputLength = Math.ceil(maxDuration * sampleRate)
    const outputBuffer = context.createBuffer(2, outputLength, sampleRate)

    const leftChannel = outputBuffer.getChannelData(0)
    const rightChannel = outputBuffer.getChannelData(1)

    // Mix each buffer
    for (const { buffer, volume, pan, startTime } of buffers) {
      const startSample = Math.floor(startTime * sampleRate)
      const numChannels = buffer.numberOfChannels

      // Calculate stereo gains from pan
      const leftGain = volume * Math.cos((pan + 1) * Math.PI / 4)
      const rightGain = volume * Math.sin((pan + 1) * Math.PI / 4)

      for (let i = 0; i < buffer.length; i++) {
        const outputIndex = startSample + i
        if (outputIndex >= outputLength) break

        // Get mono or stereo input
        let leftSample: number
        let rightSample: number

        if (numChannels === 1) {
          leftSample = buffer.getChannelData(0)[i]
          rightSample = leftSample
        } else {
          leftSample = buffer.getChannelData(0)[i]
          rightSample = buffer.getChannelData(1)[i]
        }

        // Apply volume and pan, then mix
        leftChannel[outputIndex] += leftSample * leftGain
        rightChannel[outputIndex] += rightSample * rightGain
      }
    }

    // Normalize if needed (prevent clipping)
    let maxSample = 0
    for (let i = 0; i < outputLength; i++) {
      maxSample = Math.max(maxSample, Math.abs(leftChannel[i]), Math.abs(rightChannel[i]))
    }

    if (maxSample > 1) {
      const normalize = 0.99 / maxSample
      for (let i = 0; i < outputLength; i++) {
        leftChannel[i] *= normalize
        rightChannel[i] *= normalize
      }
    }

    return outputBuffer
  }
}

export const audioExporter = new AudioExporter()
