import { useState, useCallback } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Modal } from '@/components/common'
import { useUIStore, useTracksStore, useProjectStore } from '@/store'
import { audioExporter } from '@/services/audio'
import { loadAudioFromUrl } from '@/utils/audio'

type ExportFormat = 'wav' | 'mp3'
type ExportQuality = 'high' | 'medium' | 'low'

const sampleRates: Record<ExportQuality, number> = {
  high: 48000,
  medium: 44100,
  low: 22050,
}

export function ExportDialog() {
  const { showExportModal, setShowExportModal } = useUIStore()
  const { tracks, getProjectDuration } = useTracksStore()
  const { project } = useProjectStore()

  const [format, setFormat] = useState<ExportFormat>('wav')
  const [quality, setQuality] = useState<ExportQuality>('high')
  const [filename, setFilename] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    setProgress(0)
    setError(null)

    try {
      const sampleRate = sampleRates[quality]
      const duration = getProjectDuration()

      // Ensure at least 1 second of audio
      const bufferLength = Math.max(Math.ceil(duration * sampleRate), sampleRate)

      const audioContext = new OfflineAudioContext(2, bufferLength, sampleRate)

      // Collect all clips with their track settings
      const clipsToRender: Array<{
        audioUrl: string
        startTime: number
        volume: number
        pan: number
      }> = []

      const hasSoloTrack = tracks.some(t => t.solo)

      for (const track of tracks) {
        // Skip muted tracks or non-solo tracks when solo is active
        if (track.muted || (hasSoloTrack && !track.solo)) continue

        for (const clip of track.clips) {
          if (clip.audioUrl) {
            clipsToRender.push({
              audioUrl: clip.audioUrl,
              startTime: clip.startTime,
              volume: track.volume * clip.gain,
              pan: track.pan,
            })
          }
        }
      }

      if (clipsToRender.length === 0) {
        setError('No audio clips to export. Add some clips first!')
        setIsExporting(false)
        return
      }

      // Load and decode all audio files
      const bufferData: Array<{
        buffer: AudioBuffer
        startTime: number
        volume: number
        pan: number
      }> = []

      for (let i = 0; i < clipsToRender.length; i++) {
        const clip = clipsToRender[i]
        setProgress(Math.round((i / clipsToRender.length) * 50)) // 0-50% for loading

        try {
          const buffer = await loadAudioFromUrl(clip.audioUrl, audioContext)
          bufferData.push({
            buffer,
            startTime: clip.startTime,
            volume: clip.volume,
            pan: clip.pan,
          })
        } catch (err) {
          console.warn('Failed to load clip:', err)
        }
      }

      setProgress(50)

      // Schedule all buffers in the offline context
      for (const { buffer, startTime, volume, pan } of bufferData) {
        const source = audioContext.createBufferSource()
        source.buffer = buffer

        // Create gain node for volume
        const gainNode = audioContext.createGain()
        gainNode.gain.value = volume

        // Create stereo panner for pan
        const pannerNode = audioContext.createStereoPanner()
        pannerNode.pan.value = pan

        // Connect: source -> gain -> panner -> destination
        source.connect(gainNode)
        gainNode.connect(pannerNode)
        pannerNode.connect(audioContext.destination)

        source.start(startTime)
      }

      setProgress(70)

      // Render the audio
      const renderedBuffer = await audioContext.startRendering()

      setProgress(90)

      // Export to file
      const exportFilename = filename || project?.name || 'export'
      await audioExporter.downloadAudio(renderedBuffer, exportFilename, format)

      setProgress(100)

      // Close dialog after successful export
      setTimeout(() => {
        setShowExportModal(false)
        setIsExporting(false)
        setProgress(0)
      }, 500)
    } catch (err) {
      console.error('Export failed:', err)
      setError(err instanceof Error ? err.message : 'Export failed')
      setIsExporting(false)
    }
  }, [tracks, quality, filename, format, getProjectDuration, setShowExportModal, project?.name])

  const duration = getProjectDuration()
  const clipCount = tracks.reduce((sum, t) => sum + t.clips.length, 0)
  const hasContent = clipCount > 0

  return (
    <Modal
      isOpen={showExportModal}
      onClose={() => setShowExportModal(false)}
      title="Export Audio"
      size="md"
    >
      <div className="space-y-4">
        {/* Project Info */}
        <div className="bg-daw-bg rounded-lg p-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-daw-text-muted">Duration: </span>
              <span>{duration.toFixed(1)}s</span>
            </div>
            <div>
              <span className="text-daw-text-muted">Tracks: </span>
              <span>{tracks.length}</span>
            </div>
            <div>
              <span className="text-daw-text-muted">Clips: </span>
              <span>{clipCount}</span>
            </div>
            <div>
              <span className="text-daw-text-muted">BPM: </span>
              <span>{project?.bpm || 120}</span>
            </div>
          </div>
        </div>

        {/* Filename */}
        <div>
          <label className="block text-sm text-daw-text-muted mb-1">
            Filename
          </label>
          <input
            type="text"
            className="input w-full"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder={project?.name || 'my-project'}
          />
        </div>

        {/* Format */}
        <div>
          <label className="block text-sm text-daw-text-muted mb-2">
            Format
          </label>
          <div className="flex gap-2">
            <button
              className={`flex-1 py-2 px-3 rounded border transition-colors ${
                format === 'wav'
                  ? 'bg-daw-accent text-white border-daw-accent'
                  : 'border-daw-border hover:bg-daw-surface-light'
              }`}
              onClick={() => setFormat('wav')}
            >
              <div className="font-medium">WAV</div>
              <div className="text-xs opacity-70">Uncompressed</div>
            </button>
            <button
              className={`flex-1 py-2 px-3 rounded border transition-colors ${
                format === 'mp3'
                  ? 'bg-daw-accent text-white border-daw-accent'
                  : 'border-daw-border hover:bg-daw-surface-light'
              } opacity-50 cursor-not-allowed`}
              onClick={() => {}}
              disabled
              title="Coming soon"
            >
              <div className="font-medium">MP3</div>
              <div className="text-xs opacity-70">Coming soon</div>
            </button>
          </div>
        </div>

        {/* Quality */}
        <div>
          <label className="block text-sm text-daw-text-muted mb-2">
            Quality
          </label>
          <div className="flex gap-2">
            {(['high', 'medium', 'low'] as const).map((q) => (
              <button
                key={q}
                className={`flex-1 py-2 px-3 rounded border transition-colors ${
                  quality === q
                    ? 'bg-daw-accent text-white border-daw-accent'
                    : 'border-daw-border hover:bg-daw-surface-light'
                }`}
                onClick={() => setQuality(q)}
              >
                <div className="font-medium capitalize">{q}</div>
                <div className="text-xs opacity-70">{sampleRates[q] / 1000}kHz</div>
              </button>
            ))}
          </div>
        </div>

        {/* Progress */}
        {isExporting && (
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Exporting...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-daw-bg rounded-full overflow-hidden">
              <div
                className="h-full bg-daw-accent transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Warning if no content */}
        {!hasContent && !error && (
          <div className="p-3 bg-daw-warning/20 border border-daw-warning/50 rounded text-daw-warning text-sm">
            No audio clips to export. Add some content first.
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            className="btn"
            onClick={() => setShowExportModal(false)}
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            className="btn-primary flex items-center justify-center gap-2"
            onClick={handleExport}
            disabled={isExporting || !hasContent}
          >
            {isExporting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={16} />
                Export
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}
