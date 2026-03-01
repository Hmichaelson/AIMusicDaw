/**
 * AudioRecorder - Service for recording audio from microphone
 */
class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private stream: MediaStream | null = null
  private isRecording = false

  /**
   * Get available audio input devices
   */
  async getInputDevices(): Promise<MediaDeviceInfo[]> {
    // First request permission to access devices
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      console.warn('Microphone permission not granted')
      return []
    }

    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.filter(d => d.kind === 'audioinput')
  }

  /**
   * Start recording from the specified device
   */
  async start(deviceId?: string): Promise<void> {
    if (this.isRecording) {
      throw new Error('Already recording')
    }

    const constraints: MediaStreamConstraints = {
      audio: deviceId
        ? {
            deviceId: { exact: deviceId },
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          }
        : {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
    }

    this.stream = await navigator.mediaDevices.getUserMedia(constraints)

    // Use the best available format
    const mimeType = this.getSupportedMimeType()
    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType,
    })

    this.audioChunks = []

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data)
      }
    }

    this.mediaRecorder.start(100) // Collect data every 100ms
    this.isRecording = true
  }

  /**
   * Stop recording and return the audio blob
   */
  async stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('No recording in progress'))
        return
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm'
        const audioBlob = new Blob(this.audioChunks, { type: mimeType })
        this.cleanup()
        resolve(audioBlob)
      }

      this.mediaRecorder.onerror = (event) => {
        this.cleanup()
        reject(new Error(`Recording error: ${event}`))
      }

      this.mediaRecorder.stop()
      this.isRecording = false
    })
  }

  /**
   * Check if currently recording
   */
  getIsRecording(): boolean {
    return this.isRecording
  }

  /**
   * Get input level (0-1) for metering
   */
  async getInputLevel(): Promise<number> {
    if (!this.stream) return 0

    const audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(this.stream)
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256

    source.connect(analyser)

    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(dataArray)

    // Calculate RMS
    let sum = 0
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i]
    }
    const rms = Math.sqrt(sum / dataArray.length)

    // Normalize to 0-1
    const level = rms / 255

    await audioContext.close()
    return level
  }

  /**
   * Get supported MIME type
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ]

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }

    return 'audio/webm' // Fallback
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
    this.mediaRecorder = null
    this.audioChunks = []
    this.isRecording = false
  }

  /**
   * Cancel recording without saving
   */
  cancel(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop()
    }
    this.cleanup()
  }
}

export const audioRecorder = new AudioRecorder()
