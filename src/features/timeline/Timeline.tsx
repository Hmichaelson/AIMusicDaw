import { useRef, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { useTracksStore, useUIStore, useTransportStore } from '@/store'
import { TRACK_HEIGHT, TRACK_HEADER_WIDTH } from '@/config/constants'
import { timeToPixels } from '@/utils'
import { TimeRuler } from './TimeRuler'
import { Track } from './Track'

export function Timeline() {
  const { tracks, addTrack, deselectAllClips } = useTracksStore()
  const { timelineZoom, timelineScrollX, setTimelineScrollX, zoomIn, zoomOut } = useUIStore()
  const { currentTime, isPlaying } = useTransportStore()
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      setTimelineScrollX(e.currentTarget.scrollLeft)
    },
    [setTimelineScrollX]
  )

  // Handle zoom with wheel
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        if (e.deltaY < 0) {
          zoomIn()
        } else {
          zoomOut()
        }
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [zoomIn, zoomOut])

  // Auto-scroll to follow playhead
  useEffect(() => {
    if (!isPlaying || !containerRef.current) return

    const container = containerRef.current
    const playheadX = timeToPixels(currentTime, timelineZoom)
    const viewportWidth = container.clientWidth - TRACK_HEADER_WIDTH
    const scrollLeft = container.scrollLeft

    // If playhead is near the right edge, scroll to follow
    if (playheadX > scrollLeft + viewportWidth - 100) {
      container.scrollLeft = playheadX - viewportWidth + 200
    }
    // If playhead is before the visible area (e.g., after looping)
    else if (playheadX < scrollLeft) {
      container.scrollLeft = Math.max(0, playheadX - 100)
    }
  }, [currentTime, timelineZoom, isPlaying])

  // Click on empty area to deselect
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      deselectAllClips()
    }
  }

  // Calculate playhead position
  const playheadX = timeToPixels(currentTime, timelineZoom) - timelineScrollX

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-daw-bg">
      {/* Time Ruler */}
      <TimeRuler />

      {/* Tracks Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto"
        onScroll={handleScroll}
        onClick={handleBackgroundClick}
      >
        <div
          className="relative min-h-full"
          style={{
            // Ensure enough width for scrolling
            minWidth: `${Math.max(2000, timeToPixels(300, timelineZoom) + TRACK_HEADER_WIDTH)}px`,
          }}
        >
          {/* Tracks */}
          {tracks.length > 0 ? (
            tracks.map((track) => (
              <Track key={track.id} track={track} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-daw-text-muted">
              <p className="mb-4">No tracks yet. Add a track to get started.</p>
              <button
                className="btn btn-primary flex items-center gap-2"
                onClick={() => addTrack()}
              >
                <Plus size={16} />
                Add Track
              </button>
            </div>
          )}

          {/* Add Track Button (at bottom) */}
          {tracks.length > 0 && (
            <div
              className="flex items-center border-b border-daw-border"
              style={{ height: TRACK_HEIGHT / 2 }}
            >
              <button
                className="flex items-center gap-2 px-4 text-sm text-daw-text-muted hover:text-daw-text transition-colors"
                style={{ width: TRACK_HEADER_WIDTH }}
                onClick={() => addTrack()}
              >
                <Plus size={14} />
                Add Track
              </button>
            </div>
          )}

          {/* Playhead */}
          {playheadX >= 0 && (
            <div
              className="absolute top-0 bottom-0 w-px bg-red-500 pointer-events-none z-50"
              style={{
                left: playheadX + TRACK_HEADER_WIDTH,
                top: 0,
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
