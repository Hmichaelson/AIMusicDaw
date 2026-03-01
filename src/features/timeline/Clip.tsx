import { useState, useRef, useEffect } from 'react'
import type { Clip as ClipType } from '@/types'
import { useTracksStore } from '@/store'
import { timeToPixels } from '@/utils'
import { TRACK_HEIGHT } from '@/config/constants'
import { Waveform } from './Waveform'

interface ClipProps {
  clip: ClipType
  trackColor: string
  pixelsPerSecond: number
  scrollX: number
}

export function Clip({ clip, trackColor, pixelsPerSecond, scrollX }: ClipProps) {
  const { selectedClipIds, selectClip, updateClip } = useTracksStore()
  const [isDragging, setIsDragging] = useState(false)
  const [showWaveform, setShowWaveform] = useState(false)
  const dragStartRef = useRef<{ x: number; startTime: number } | null>(null)
  const clipRef = useRef<HTMLDivElement>(null)

  const isSelected = selectedClipIds.includes(clip.id)
  const left = timeToPixels(clip.startTime, pixelsPerSecond) - scrollX
  const width = timeToPixels(clip.duration, pixelsPerSecond)

  // Don't render if completely off screen
  if (left + width < -100) return null

  // Delay waveform loading slightly for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWaveform(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [clip.audioUrl])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()

    // Select clip
    const addToSelection = e.shiftKey || e.metaKey || e.ctrlKey
    if (!isSelected || !addToSelection) {
      selectClip(clip.id, addToSelection)
    }

    // Start drag
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX,
      startTime: clip.startTime,
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return

      const deltaX = e.clientX - dragStartRef.current.x
      const deltaTime = deltaX / pixelsPerSecond
      const newStartTime = Math.max(0, dragStartRef.current.startTime + deltaTime)

      updateClip(clip.id, { startTime: newStartTime })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      dragStartRef.current = null
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const clipHeight = TRACK_HEIGHT - 8
  const headerHeight = 20
  const waveformHeight = clipHeight - headerHeight

  return (
    <div
      ref={clipRef}
      className={`absolute rounded overflow-hidden cursor-grab transition-shadow ${
        isSelected ? 'ring-2 ring-daw-accent shadow-lg' : 'shadow'
      } ${isDragging ? 'cursor-grabbing opacity-80' : ''}`}
      style={{
        left,
        width: Math.max(width, 4),
        top: 4,
        height: clipHeight,
        backgroundColor: trackColor + '30',
        borderLeft: `3px solid ${trackColor}`,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Clip header */}
      <div
        className="px-2 py-0.5 text-xs font-medium truncate flex items-center"
        style={{
          backgroundColor: trackColor + '50',
          height: headerHeight,
        }}
      >
        {clip.name}
      </div>

      {/* Waveform */}
      <div
        className="relative overflow-hidden"
        style={{ height: waveformHeight }}
      >
        {showWaveform && clip.audioUrl && width > 10 ? (
          <Waveform
            audioUrl={clip.audioUrl}
            color={trackColor}
            height={waveformHeight}
            width={Math.max(width - 3, 10)}
          />
        ) : (
          // Loading placeholder
          <div className="w-full h-full flex items-center justify-center">
            <div
              className="w-full h-1/2 opacity-20 rounded"
              style={{
                background: `linear-gradient(90deg, transparent, ${trackColor}, transparent)`,
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          </div>
        )}
      </div>

      {/* Resize handles */}
      {isSelected && (
        <>
          <div
            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 transition-colors"
            onMouseDown={(e) => {
              e.stopPropagation()
              // TODO: Implement left edge resize (trim start)
            }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 transition-colors"
            onMouseDown={(e) => {
              e.stopPropagation()
              // TODO: Implement right edge resize (trim end)
            }}
          />
        </>
      )}

      {/* Duration overlay on hover */}
      <div className="absolute bottom-1 right-1 text-[10px] text-white/60 bg-black/30 px-1 rounded opacity-0 hover:opacity-100 transition-opacity">
        {formatDuration(clip.duration)}
      </div>
    </div>
  )
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
