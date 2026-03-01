import { useEffect, useCallback } from 'react'
import { Header, Sidebar } from '@/components/layout'
import { Timeline } from '@/features/timeline'
import { Transport } from '@/features/transport'
import { Mixer } from '@/features/mixer'
import { ExportDialog, ShortcutsDialog } from '@/features/project'
import { useProjectStore, useTracksStore } from '@/store'
import { audioEngine } from '@/services/audio'
import { isSupportedAudioFile, getAudioDuration } from '@/utils'
import { useKeyboardShortcuts } from '@/hooks'

export default function App() {
  const { createProject, project } = useProjectStore()
  const { addTrack, addClip, tracks } = useTracksStore()

  // Initialize keyboard shortcuts
  useKeyboardShortcuts()

  // Initialize project on mount
  useEffect(() => {
    if (!project) {
      createProject('My First Project')
    }
  }, [project, createProject])

  // Initialize audio engine on first user interaction
  const handleInitAudio = useCallback(async () => {
    if (!audioEngine.isReady()) {
      await audioEngine.initialize()
      // Set initial BPM
      if (project?.bpm) {
        audioEngine.setBpm(project.bpm)
      }
    }
  }, [project?.bpm])

  // Create track channels when tracks change
  useEffect(() => {
    tracks.forEach((track) => {
      audioEngine.createTrackChannel(track.id)
      audioEngine.setTrackVolume(track.id, track.volume)
      audioEngine.setTrackPan(track.id, track.pan)
      audioEngine.setTrackMute(track.id, track.muted)
    })
  }, [tracks])

  // Handle file drop
  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()

      // Initialize audio if needed
      await handleInitAudio()

      const files = Array.from(e.dataTransfer.files)
      const audioFiles = files.filter(isSupportedAudioFile)

      for (const file of audioFiles) {
        try {
          // Create blob URL for the file
          const audioUrl = URL.createObjectURL(file)
          const duration = await getAudioDuration(audioUrl)

          // Create a new track if none exist, or use the first track
          let trackId: string
          if (tracks.length === 0) {
            trackId = addTrack(file.name.replace(/\.[^/.]+$/, ''))
          } else {
            trackId = tracks[0].id
          }

          // Add clip to track
          addClip(trackId, {
            name: file.name.replace(/\.[^/.]+$/, ''),
            audioUrl,
            startTime: 0,
            duration,
            offset: 0,
            fadeIn: 0,
            fadeOut: 0,
            gain: 1,
          })

          // Load audio into engine
          const clipId = tracks.find(t => t.id === trackId)?.clips.slice(-1)[0]?.id
          if (clipId) {
            await audioEngine.loadClip(clipId, audioUrl)
            audioEngine.scheduleClip(clipId, trackId, 0, 0, duration, 1)
          }
        } catch (error) {
          console.error('Failed to import audio file:', error)
        }
      }
    },
    [handleInitAudio, tracks, addTrack, addClip]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      onClick={handleInitAudio}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Timeline />
          <Mixer />
        </div>
      </div>

      {/* Transport */}
      <Transport />

      {/* Modals */}
      <ExportDialog />
      <ShortcutsDialog />

      {/* Drop overlay */}
      <DropOverlay />
    </div>
  )
}

function DropOverlay() {
  return null // Can be implemented later for visual feedback during drag
}
