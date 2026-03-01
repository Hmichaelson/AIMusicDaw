import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'

interface UseWaveformOptions {
  audioUrl: string
  color?: string
  height?: number
  barWidth?: number
  barGap?: number
  barRadius?: number
}

interface UseWaveformReturn {
  containerRef: React.RefObject<HTMLDivElement>
  isLoading: boolean
  isReady: boolean
  duration: number
  peaks: number[] | null
}

export function useWaveform({
  audioUrl,
  color = '#4a9eff',
  height = 60,
  barWidth = 2,
  barGap = 1,
  barRadius = 2,
}: UseWaveformOptions): UseWaveformReturn {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isReady, setIsReady] = useState(false)
  const [duration, setDuration] = useState(0)
  const [peaks, setPeaks] = useState<number[] | null>(null)

  useEffect(() => {
    if (!containerRef.current || !audioUrl) return

    setIsLoading(true)
    setIsReady(false)

    // Create wavesurfer instance
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: color,
      progressColor: color,
      cursorWidth: 0,
      height,
      barWidth,
      barGap,
      barRadius,
      normalize: true,
      interact: false,
      hideScrollbar: true,
      fillParent: true,
    })

    wavesurferRef.current = wavesurfer

    // Load audio
    wavesurfer.load(audioUrl)

    wavesurfer.on('ready', () => {
      setIsLoading(false)
      setIsReady(true)
      setDuration(wavesurfer.getDuration())

      // Export peaks for caching
      const exportedPeaks = wavesurfer.exportPeaks()
      if (exportedPeaks && exportedPeaks[0]) {
        setPeaks(Array.from(exportedPeaks[0]))
      }
    })

    wavesurfer.on('error', (error) => {
      console.error('Wavesurfer error:', error)
      setIsLoading(false)
    })

    return () => {
      wavesurfer.destroy()
      wavesurferRef.current = null
    }
  }, [audioUrl, color, height, barWidth, barGap, barRadius])

  return {
    containerRef,
    isLoading,
    isReady,
    duration,
    peaks,
  }
}

/**
 * Hook to extract waveform peaks from an audio URL without rendering
 */
export function useWaveformPeaks(audioUrl: string, samplesPerPixel: number = 100) {
  const [peaks, setPeaks] = useState<number[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!audioUrl) return

    setIsLoading(true)

    const audioContext = new AudioContext()

    fetch(audioUrl)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        const channelData = audioBuffer.getChannelData(0)
        const extractedPeaks: number[] = []

        for (let i = 0; i < channelData.length; i += samplesPerPixel) {
          let max = 0
          const end = Math.min(i + samplesPerPixel, channelData.length)

          for (let j = i; j < end; j++) {
            const abs = Math.abs(channelData[j])
            if (abs > max) max = abs
          }

          extractedPeaks.push(max)
        }

        setPeaks(extractedPeaks)
        setIsLoading(false)
        audioContext.close()
      })
      .catch(error => {
        console.error('Failed to extract peaks:', error)
        setIsLoading(false)
        audioContext.close()
      })

    return () => {
      audioContext.close().catch(() => {})
    }
  }, [audioUrl, samplesPerPixel])

  return { peaks, isLoading }
}
