import { useEffect, useCallback, useState, useRef } from 'react'
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Repeat,
  Circle,
  Mic,
} from 'lucide-react'
import { useTransportStore, useProjectStore, useTracksStore } from '@/store'
import { audioEngine, audioRecorder } from '@/services/audio'
import { formatTime } from '@/utils'

export function Transport() {
  const {
    isPlaying,
    isRecording,
    currentTime,
    loopEnabled,
    stop,
    togglePlayPause,
    toggleLoop,
    setCurrentTime,
    goToStart,
    startRecording,
    stopRecording,
  } = useTransportStore()

  const { project, setBpm } = useProjectStore()
  const { tracks, getProjectDuration, addTrack, addClip } = useTracksStore()

  const bpm = project?.bpm || 120

  // Recording state
  const [inputLevel, setInputLevel] = useState(0)
  const [showDeviceSelector, setShowDeviceSelector] = useState(false)
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>()
  const recordingStartTimeRef = useRef<number>(0)
  const levelIntervalRef = useRef<number | null>(null)

  // Sync transport state with audio engine
  useEffect(() => {
    if (isPlaying) {
      audioEngine.play()
    } else {
      audioEngine.pause()
    }
  }, [isPlaying])

  // Update current time from audio engine
  useEffect(() => {
    let animationFrame: number

    const updateTime = () => {
      if (audioEngine.isPlaying()) {
        setCurrentTime(audioEngine.getCurrentTime())
      }
      animationFrame = requestAnimationFrame(updateTime)
    }

    if (isPlaying) {
      animationFrame = requestAnimationFrame(updateTime)
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [isPlaying, setCurrentTime])

  // Load input devices on mount
  useEffect(() => {
    audioRecorder.getInputDevices().then(setInputDevices).catch(console.error)
  }, [])

  // Toggle recording handler
  const handleToggleRecording = useCallback(async () => {
    if (isRecording) {
      // Stop recording
      try {
        const audioBlob = await audioRecorder.stop()
        stopRecording()

        // Clear level meter
        if (levelIntervalRef.current) {
          clearInterval(levelIntervalRef.current)
          levelIntervalRef.current = null
        }
        setInputLevel(0)

        // Create blob URL for the recorded audio
        const audioUrl = URL.createObjectURL(audioBlob)

        // Get audio duration
        const audioContext = new AudioContext()
        const arrayBuffer = await audioBlob.arrayBuffer()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        const duration = audioBuffer.duration
        await audioContext.close()

        // Find armed track or create new one
        let targetTrackId = tracks.find(t => t.armed)?.id
        if (!targetTrackId) {
          targetTrackId = addTrack('Recorded Audio')
        }

        // Add clip to track
        addClip(targetTrackId, {
          name: `Recording ${new Date().toLocaleTimeString()}`,
          audioUrl,
          startTime: recordingStartTimeRef.current,
          duration,
          offset: 0,
          fadeIn: 0,
          fadeOut: 0,
          gain: 1,
        })
      } catch (error) {
        console.error('Failed to stop recording:', error)
        stopRecording()
      }
    } else {
      // Start recording
      try {
        // Request device list again in case it changed
        const devices = await audioRecorder.getInputDevices()
        setInputDevices(devices)

        if (devices.length === 0) {
          alert('No microphone found. Please connect a microphone and try again.')
          return
        }

        await audioRecorder.start(selectedDeviceId)
        recordingStartTimeRef.current = currentTime
        startRecording()

        // Start level metering
        levelIntervalRef.current = window.setInterval(async () => {
          const level = await audioRecorder.getInputLevel()
          setInputLevel(level)
        }, 100)
      } catch (error) {
        console.error('Failed to start recording:', error)
        alert('Failed to access microphone. Please check permissions.')
      }
    }
  }, [isRecording, selectedDeviceId, currentTime, tracks, addTrack, addClip, startRecording, stopRecording])

  // Keyboard shortcuts for transport
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlayPause()
          break
        case 'Enter':
          e.preventDefault()
          stop()
          break
        case 'Home':
          e.preventDefault()
          goToStart()
          break
        case 'r':
        case 'R':
          e.preventDefault()
          handleToggleRecording()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlayPause, stop, goToStart, handleToggleRecording])

  const handleBpmChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10)
      if (value >= 20 && value <= 300) {
        setBpm(value)
        audioEngine.setBpm(value)
      }
    },
    [setBpm]
  )

  return (
    <div className="h-14 bg-daw-surface border-t border-daw-border flex items-center px-4 gap-4">
      {/* Transport Controls */}
      <div className="flex items-center gap-1">
        <button
          className="btn-icon"
          onClick={goToStart}
          title="Go to start (Home)"
        >
          <SkipBack size={18} />
        </button>

        <button
          className={`btn-icon ${isPlaying ? 'text-daw-accent' : ''}`}
          onClick={togglePlayPause}
          title="Play/Pause (Space)"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>

        <button
          className="btn-icon"
          onClick={stop}
          title="Stop (Enter)"
        >
          <Square size={18} />
        </button>

        <button
          className={`btn-icon ${isRecording ? 'text-red-500 animate-pulse' : ''}`}
          onClick={handleToggleRecording}
          title="Record (R)"
        >
          <Circle size={18} className={isRecording ? 'fill-current' : ''} />
        </button>

        {/* Input Device Selector */}
        <div className="relative">
          <button
            className={`btn-icon ${showDeviceSelector ? 'text-daw-accent' : ''}`}
            onClick={() => setShowDeviceSelector(!showDeviceSelector)}
            title="Select Input Device"
          >
            <Mic size={16} />
          </button>

          {showDeviceSelector && (
            <div className="absolute top-full left-0 mt-2 bg-daw-surface border border-daw-border rounded-lg shadow-xl z-50 min-w-[200px]">
              <div className="p-2 border-b border-daw-border text-xs text-daw-text-muted">
                Input Device
              </div>
              {inputDevices.length === 0 ? (
                <div className="p-3 text-sm text-daw-text-muted">
                  No devices found
                </div>
              ) : (
                <div className="py-1">
                  {inputDevices.map((device) => (
                    <button
                      key={device.deviceId}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-daw-surface-light ${
                        selectedDeviceId === device.deviceId ? 'text-daw-accent' : ''
                      }`}
                      onClick={() => {
                        setSelectedDeviceId(device.deviceId)
                        setShowDeviceSelector(false)
                      }}
                    >
                      {device.label || `Device ${device.deviceId.slice(0, 8)}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recording Level Meter */}
        {isRecording && (
          <div className="flex items-center gap-1">
            <div className="w-16 h-2 bg-daw-bg rounded overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all"
                style={{ width: `${Math.min(inputLevel * 100, 100)}%` }}
              />
            </div>
            <span className="text-xs text-red-500 font-medium">REC</span>
          </div>
        )}

        <button
          className="btn-icon"
          onClick={() => {
            const duration = getProjectDuration()
            if (duration > 0) {
              setCurrentTime(duration)
              audioEngine.seek(duration)
            }
          }}
          title="Go to end (End)"
        >
          <SkipForward size={18} />
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-daw-border" />

      {/* Time Display */}
      <div className="bg-daw-bg px-3 py-1.5 rounded font-mono text-lg min-w-[140px] text-center">
        {formatTime(currentTime)}
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-daw-border" />

      {/* Loop Toggle */}
      <button
        className={`btn-icon ${loopEnabled ? 'text-daw-accent bg-daw-surface-light' : ''}`}
        onClick={toggleLoop}
        title="Toggle Loop (L)"
      >
        <Repeat size={18} />
      </button>

      {/* Divider */}
      <div className="w-px h-8 bg-daw-border" />

      {/* BPM */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-daw-text-muted">BPM</span>
        <input
          type="number"
          className="input w-16 text-center py-1 text-sm"
          value={bpm}
          onChange={handleBpmChange}
          min={20}
          max={300}
        />
      </div>

      {/* Time Signature */}
      <div className="flex items-center gap-1">
        <span className="text-sm text-daw-text-muted">
          {project?.timeSignature?.[0] || 4}/{project?.timeSignature?.[1] || 4}
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Audio Context Status */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            audioEngine.isReady() ? 'bg-daw-success' : 'bg-daw-warning'
          }`}
        />
        <span className="text-xs text-daw-text-muted">
          {audioEngine.isReady() ? 'Audio Ready' : 'Click to start audio'}
        </span>
      </div>
    </div>
  )
}
