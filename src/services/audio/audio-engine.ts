import * as Tone from 'tone'

/**
 * AudioEngine - Singleton wrapper around Tone.js for DAW functionality
 *
 * Handles:
 * - Audio context initialization
 * - Transport control (play, pause, stop, seek)
 * - Track channel management
 * - Clip scheduling and playback
 * - Master output
 */
class AudioEngine {
  private static instance: AudioEngine
  private masterChannel: Tone.Channel
  private trackChannels: Map<string, Tone.Channel> = new Map()
  private players: Map<string, Tone.Player> = new Map()
  private scheduledEvents: Map<string, number[]> = new Map() // clipId -> eventIds
  private initialized = false

  private constructor() {
    // Master channel connected to destination
    this.masterChannel = new Tone.Channel().toDestination()
  }

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine()
    }
    return AudioEngine.instance
  }

  /**
   * Initialize audio context (requires user interaction)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    await Tone.start()
    this.initialized = true
    console.log('AudioEngine initialized')
  }

  /**
   * Check if audio context is running
   */
  isReady(): boolean {
    return Tone.getContext().state === 'running'
  }

  /**
   * Get current audio context state
   */
  getState(): AudioContextState {
    return Tone.getContext().state
  }

  // ============================================
  // Transport Controls
  // ============================================

  /**
   * Start playback
   */
  play(): void {
    Tone.getTransport().start()
  }

  /**
   * Pause playback
   */
  pause(): void {
    Tone.getTransport().pause()
  }

  /**
   * Stop playback and return to start
   */
  stop(): void {
    Tone.getTransport().stop()
    Tone.getTransport().position = 0
  }

  /**
   * Seek to position in seconds
   */
  seek(time: number): void {
    const wasPlaying = Tone.getTransport().state === 'started'
    if (wasPlaying) {
      Tone.getTransport().pause()
    }
    Tone.getTransport().seconds = Math.max(0, time)
    if (wasPlaying) {
      Tone.getTransport().start()
    }
  }

  /**
   * Get current playback position in seconds
   */
  getCurrentTime(): number {
    return Tone.getTransport().seconds
  }

  /**
   * Check if currently playing
   */
  isPlaying(): boolean {
    return Tone.getTransport().state === 'started'
  }

  /**
   * Set BPM
   */
  setBpm(bpm: number): void {
    Tone.getTransport().bpm.value = bpm
  }

  /**
   * Get current BPM
   */
  getBpm(): number {
    return Tone.getTransport().bpm.value
  }

  /**
   * Set loop region
   */
  setLoop(start: number, end: number): void {
    Tone.getTransport().setLoopPoints(start, end)
    Tone.getTransport().loop = true
  }

  /**
   * Disable loop
   */
  disableLoop(): void {
    Tone.getTransport().loop = false
  }

  /**
   * Toggle loop
   */
  toggleLoop(): void {
    Tone.getTransport().loop = !Tone.getTransport().loop
  }

  /**
   * Schedule callback for transport updates
   */
  scheduleRepeat(callback: (time: number) => void, interval: number = 0.05): number {
    return Tone.getTransport().scheduleRepeat(() => {
      callback(Tone.getTransport().seconds)
    }, interval)
  }

  /**
   * Clear scheduled callback
   */
  clearSchedule(eventId: number): void {
    Tone.getTransport().clear(eventId)
  }

  // ============================================
  // Track Management
  // ============================================

  /**
   * Create a channel for a track
   */
  createTrackChannel(trackId: string): void {
    if (this.trackChannels.has(trackId)) return

    const channel = new Tone.Channel().connect(this.masterChannel)
    this.trackChannels.set(trackId, channel)
  }

  /**
   * Remove a track channel
   */
  removeTrackChannel(trackId: string): void {
    const channel = this.trackChannels.get(trackId)
    if (channel) {
      channel.dispose()
      this.trackChannels.delete(trackId)
    }
  }

  /**
   * Set track volume (0-1)
   */
  setTrackVolume(trackId: string, volume: number): void {
    const channel = this.trackChannels.get(trackId)
    if (channel) {
      // Convert linear gain to dB
      channel.volume.value = volume > 0 ? 20 * Math.log10(volume) : -Infinity
    }
  }

  /**
   * Set track pan (-1 to 1)
   */
  setTrackPan(trackId: string, pan: number): void {
    const channel = this.trackChannels.get(trackId)
    if (channel) {
      channel.pan.value = pan
    }
  }

  /**
   * Set track mute
   */
  setTrackMute(trackId: string, muted: boolean): void {
    const channel = this.trackChannels.get(trackId)
    if (channel) {
      channel.mute = muted
    }
  }

  /**
   * Set track solo (implementation depends on other tracks)
   */
  setTrackSolo(trackId: string, solo: boolean, allTrackIds: string[]): void {
    // Get all tracks that are soloed
    const soloedTracks = new Set<string>()

    if (solo) {
      soloedTracks.add(trackId)
    }

    // If any track is soloed, mute all others
    const anySoloed = soloedTracks.size > 0

    for (const id of allTrackIds) {
      const channel = this.trackChannels.get(id)
      if (channel) {
        if (anySoloed) {
          channel.mute = !soloedTracks.has(id)
        }
      }
    }
  }

  // ============================================
  // Clip Playback
  // ============================================

  /**
   * Load audio for a clip
   */
  async loadClip(clipId: string, audioUrl: string): Promise<void> {
    // Dispose existing player if any
    const existingPlayer = this.players.get(clipId)
    if (existingPlayer) {
      existingPlayer.dispose()
    }

    const player = new Tone.Player(audioUrl)
    await Tone.loaded()
    this.players.set(clipId, player)
  }

  /**
   * Unload clip audio
   */
  unloadClip(clipId: string): void {
    const player = this.players.get(clipId)
    if (player) {
      player.dispose()
      this.players.delete(clipId)
    }

    // Clear scheduled events
    const events = this.scheduledEvents.get(clipId)
    if (events) {
      events.forEach((eventId) => Tone.getTransport().clear(eventId))
      this.scheduledEvents.delete(clipId)
    }
  }

  /**
   * Schedule a clip for playback
   */
  scheduleClip(
    clipId: string,
    trackId: string,
    startTime: number,
    offset: number = 0,
    duration?: number,
    gain: number = 1
  ): void {
    const player = this.players.get(clipId)
    const channel = this.trackChannels.get(trackId)

    if (!player || !channel) {
      console.warn(`Cannot schedule clip ${clipId}: player or channel not found`)
      return
    }

    // Connect player to track channel
    player.disconnect()
    player.connect(channel)

    // Clear any existing scheduled events for this clip
    const existingEvents = this.scheduledEvents.get(clipId)
    if (existingEvents) {
      existingEvents.forEach((eventId) => Tone.getTransport().clear(eventId))
    }

    // Set player gain
    player.volume.value = gain > 0 ? 20 * Math.log10(gain) : -Infinity

    // Schedule the clip
    const eventId = Tone.getTransport().schedule((time) => {
      player.start(time, offset, duration)
    }, startTime)

    this.scheduledEvents.set(clipId, [eventId])
  }

  /**
   * Unschedule a clip
   */
  unscheduleClip(clipId: string): void {
    const events = this.scheduledEvents.get(clipId)
    if (events) {
      events.forEach((eventId) => Tone.getTransport().clear(eventId))
      this.scheduledEvents.delete(clipId)
    }

    // Stop the player if it's playing
    const player = this.players.get(clipId)
    if (player) {
      player.stop()
    }
  }

  /**
   * Reschedule all clips (call after seeking or modifying clips)
   */
  rescheduleAllClips(
    clips: Array<{
      clipId: string
      trackId: string
      startTime: number
      offset: number
      duration: number
      gain: number
    }>
  ): void {
    // Clear all scheduled events
    this.scheduledEvents.forEach((events) => {
      events.forEach((eventId) => Tone.getTransport().clear(eventId))
    })
    this.scheduledEvents.clear()

    // Stop all players
    this.players.forEach((player) => player.stop())

    // Reschedule all clips
    for (const clip of clips) {
      this.scheduleClip(
        clip.clipId,
        clip.trackId,
        clip.startTime,
        clip.offset,
        clip.duration,
        clip.gain
      )
    }
  }

  // ============================================
  // Master Controls
  // ============================================

  /**
   * Set master volume (0-1)
   */
  setMasterVolume(volume: number): void {
    this.masterChannel.volume.value = volume > 0 ? 20 * Math.log10(volume) : -Infinity
  }

  /**
   * Set master mute
   */
  setMasterMute(muted: boolean): void {
    this.masterChannel.mute = muted
  }

  /**
   * Get master meter level
   */
  getMasterLevel(): number {
    // This would require a Tone.Meter, which we can add later
    return 0
  }

  // ============================================
  // Cleanup
  // ============================================

  /**
   * Dispose all resources
   */
  dispose(): void {
    // Stop transport
    Tone.getTransport().stop()
    Tone.getTransport().cancel()

    // Dispose all players
    this.players.forEach((player) => player.dispose())
    this.players.clear()

    // Dispose all channels
    this.trackChannels.forEach((channel) => channel.dispose())
    this.trackChannels.clear()

    // Dispose master
    this.masterChannel.dispose()

    this.scheduledEvents.clear()
    this.initialized = false
  }
}

// Export singleton instance
export const audioEngine = AudioEngine.getInstance()
