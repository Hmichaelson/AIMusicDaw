import { useEffect, useRef, memo } from 'react'
import WaveSurfer from 'wavesurfer.js'

interface WaveformProps {
  audioUrl: string
  color: string
  height: number
  width: number
}

export const Waveform = memo(function Waveform({
  audioUrl,
  color,
  height,
  width,
}: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)

  useEffect(() => {
    if (!containerRef.current || !audioUrl || width <= 0) return

    // Destroy existing instance
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy()
    }

    // Create new instance
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: color,
      progressColor: color,
      cursorWidth: 0,
      height: height - 4,
      barWidth: 2,
      barGap: 1,
      barRadius: 1,
      normalize: true,
      interact: false,
      hideScrollbar: true,
      fillParent: true,
      minPxPerSec: 0,
    })

    wavesurferRef.current = wavesurfer

    // Load audio
    wavesurfer.load(audioUrl)

    return () => {
      wavesurfer.destroy()
      wavesurferRef.current = null
    }
  }, [audioUrl, color, height, width])

  return (
    <div
      ref={containerRef}
      className="w-full h-full opacity-80"
      style={{ width }}
    />
  )
})

/**
 * Simple canvas-based waveform for better performance with many clips
 */
interface SimpleWaveformProps {
  peaks: number[]
  color: string
  height: number
  width: number
}

export const SimpleWaveform = memo(function SimpleWaveform({
  peaks,
  color,
  height,
  width,
}: SimpleWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !peaks.length || width <= 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    // Clear
    ctx.clearRect(0, 0, width, height)

    // Draw waveform
    ctx.fillStyle = color

    const barWidth = 2
    const barGap = 1
    const totalBarWidth = barWidth + barGap
    const numBars = Math.floor(width / totalBarWidth)
    const samplesPerBar = Math.ceil(peaks.length / numBars)

    const centerY = height / 2

    for (let i = 0; i < numBars; i++) {
      // Get max peak for this bar
      let max = 0
      const startSample = Math.floor(i * samplesPerBar)
      const endSample = Math.min(startSample + samplesPerBar, peaks.length)

      for (let j = startSample; j < endSample; j++) {
        if (peaks[j] > max) max = peaks[j]
      }

      // Draw bar
      const barHeight = max * (height - 4)
      const x = i * totalBarWidth
      const y = centerY - barHeight / 2

      ctx.beginPath()
      ctx.roundRect(x, y, barWidth, barHeight, 1)
      ctx.fill()
    }
  }, [peaks, color, height, width])

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="opacity-70"
    />
  )
})
