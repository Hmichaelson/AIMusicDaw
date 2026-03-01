import { Volume2, VolumeX, Headphones } from 'lucide-react'
import type { Track as TrackType } from '@/types'
import { useTracksStore, useUIStore } from '@/store'
import { TRACK_HEIGHT, TRACK_HEADER_WIDTH, TRACK_COLORS } from '@/config/constants'
import { Clip } from './Clip'

interface TrackProps {
  track: TrackType
}

export function Track({ track }: TrackProps) {
  const { selectedTrackId, selectTrack, toggleTrackMute, toggleTrackSolo } = useTracksStore()
  const { timelineZoom, timelineScrollX } = useUIStore()

  const isSelected = selectedTrackId === track.id
  const trackColor = TRACK_COLORS[track.color] || TRACK_COLORS.blue

  return (
    <div
      className={`flex border-b border-daw-border ${
        isSelected ? 'bg-daw-surface-light' : ''
      }`}
      style={{ height: TRACK_HEIGHT }}
    >
      {/* Track Header */}
      <div
        className="flex-shrink-0 flex items-center gap-2 px-2 border-r border-daw-border bg-daw-surface"
        style={{ width: TRACK_HEADER_WIDTH }}
        onClick={() => selectTrack(track.id)}
      >
        {/* Color indicator */}
        <div
          className="w-1 h-12 rounded"
          style={{ backgroundColor: trackColor }}
        />

        {/* Track name */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{track.name}</div>
          <div className="text-xs text-daw-text-muted">
            {track.clips.length} clip{track.clips.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Track controls */}
        <div className="flex items-center gap-1">
          <button
            className={`p-1 rounded transition-colors ${
              track.muted
                ? 'bg-red-500/20 text-red-400'
                : 'hover:bg-daw-surface-light text-daw-text-muted hover:text-daw-text'
            }`}
            onClick={(e) => {
              e.stopPropagation()
              toggleTrackMute(track.id)
            }}
            title="Mute (M)"
          >
            {track.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          <button
            className={`p-1 rounded transition-colors ${
              track.solo
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'hover:bg-daw-surface-light text-daw-text-muted hover:text-daw-text'
            }`}
            onClick={(e) => {
              e.stopPropagation()
              toggleTrackSolo(track.id)
            }}
            title="Solo (S)"
          >
            <Headphones size={14} />
          </button>
        </div>
      </div>

      {/* Track Content (Clips) */}
      <div className="flex-1 relative overflow-hidden bg-daw-bg">
        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent ${timelineZoom - 1}px,
              #3d3d3d ${timelineZoom - 1}px,
              #3d3d3d ${timelineZoom}px
            )`,
            backgroundPosition: `${-timelineScrollX}px 0`,
          }}
        />

        {/* Clips */}
        {track.clips.map((clip) => (
          <Clip
            key={clip.id}
            clip={clip}
            trackColor={trackColor}
            pixelsPerSecond={timelineZoom}
            scrollX={timelineScrollX}
          />
        ))}

        {/* Drop zone indicator */}
        <div className="absolute inset-0 pointer-events-none" />
      </div>
    </div>
  )
}
