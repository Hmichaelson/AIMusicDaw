import { useProjectStore, useUIStore, useTransportStore } from '@/store'
import { getTimeRulerMarkers, timeToPixels } from '@/utils'
import { TIME_RULER_HEIGHT, TRACK_HEADER_WIDTH } from '@/config/constants'

export function TimeRuler() {
  const { project } = useProjectStore()
  const { timelineZoom, timelineScrollX } = useUIStore()
  const { currentTime, setCurrentTime } = useTransportStore()

  const bpm = project?.bpm || 120
  const timeSignature = project?.timeSignature || [4, 4]

  // Calculate visible range
  const visibleWidth = window.innerWidth - TRACK_HEADER_WIDTH - 300 // sidebar
  const startTime = timelineScrollX / timelineZoom
  const endTime = startTime + visibleWidth / timelineZoom + 10 // buffer

  const markers = getTimeRulerMarkers(
    startTime,
    endTime,
    timelineZoom,
    bpm,
    timeSignature as [number, number]
  )

  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left + timelineScrollX
    const time = x / timelineZoom
    setCurrentTime(Math.max(0, time))
  }

  const playheadX = timeToPixels(currentTime, timelineZoom) - timelineScrollX

  return (
    <div
      className="relative bg-daw-surface-light border-b border-daw-border cursor-pointer"
      style={{ height: TIME_RULER_HEIGHT, marginLeft: TRACK_HEADER_WIDTH }}
      onClick={handleClick}
    >
      {/* Markers */}
      {markers.map((marker, index) => {
        const x = timeToPixels(marker.time, timelineZoom) - timelineScrollX

        if (x < -50 || x > visibleWidth + 50) return null

        return (
          <div
            key={index}
            className="absolute top-0 flex flex-col items-center"
            style={{ left: x }}
          >
            <span
              className={`text-xs ${
                marker.major ? 'text-daw-text' : 'text-daw-text-muted'
              }`}
              style={{ transform: 'translateX(-50%)' }}
            >
              {marker.label}
            </span>
            <div
              className={`w-px ${marker.major ? 'bg-daw-border' : 'bg-daw-surface-lighter'}`}
              style={{ height: marker.major ? 10 : 6, marginTop: 2 }}
            />
          </div>
        )
      })}

      {/* Playhead marker */}
      {playheadX >= 0 && playheadX <= visibleWidth && (
        <div
          className="absolute bottom-0"
          style={{ left: playheadX }}
        >
          <div
            className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-red-500"
            style={{ transform: 'translateX(-5px)' }}
          />
        </div>
      )}
    </div>
  )
}
