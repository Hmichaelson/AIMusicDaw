import { useEffect, useCallback } from 'react'
import { useTransportStore, useTracksStore, useUIStore } from '@/store'
import { audioEngine } from '@/services/audio'

/**
 * Hook for handling global keyboard shortcuts
 */
export function useKeyboardShortcuts() {
  const transport = useTransportStore()
  const tracks = useTracksStore()
  const ui = useUIStore()

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if typing in an input or textarea
    const target = e.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return
    }

    const isMeta = e.metaKey || e.ctrlKey
    const isShift = e.shiftKey

    // Transport controls
    if (e.key === ' ') {
      e.preventDefault()
      transport.togglePlayPause()
      return
    }

    if (e.key === 'Enter' && !isMeta) {
      e.preventDefault()
      transport.stop()
      return
    }

    if (e.key === 'Home') {
      e.preventDefault()
      transport.goToStart()
      audioEngine.seek(0)
      return
    }

    if (e.key === 'End') {
      e.preventDefault()
      const duration = tracks.getProjectDuration()
      transport.setCurrentTime(duration)
      audioEngine.seek(duration)
      return
    }

    if (e.key === 'l' && !isMeta) {
      e.preventDefault()
      transport.toggleLoop()
      return
    }

    // Zoom controls
    if (e.key === '=' || e.key === '+') {
      e.preventDefault()
      ui.zoomIn()
      return
    }

    if (e.key === '-') {
      e.preventDefault()
      ui.zoomOut()
      return
    }

    // Edit operations
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      tracks.deleteSelectedClips()
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      tracks.deselectAllClips()
      tracks.selectTrack(null)
      ui.setShowExportModal(false)
      ui.setShowShortcutsModal(false)
      return
    }

    // Track controls
    if (isMeta && e.key === 't') {
      e.preventDefault()
      tracks.addTrack()
      return
    }

    if (e.key === 'm' && !isMeta) {
      const selectedTrack = tracks.selectedTrackId
      if (selectedTrack) {
        tracks.toggleTrackMute(selectedTrack)
        const track = tracks.getTrackById(selectedTrack)
        if (track) {
          audioEngine.setTrackMute(selectedTrack, !track.muted)
        }
      }
      return
    }

    if (e.key === 's' && !isMeta) {
      const selectedTrack = tracks.selectedTrackId
      if (selectedTrack) {
        tracks.toggleTrackSolo(selectedTrack)
      }
      return
    }

    // Project controls
    if (isMeta && e.key === 's') {
      e.preventDefault()
      console.log('Save project')
      return
    }

    if (isMeta && isShift && e.key === 'e') {
      e.preventDefault()
      ui.setShowExportModal(true)
      return
    }

    // UI controls
    if (e.key === '?') {
      e.preventDefault()
      ui.setShowShortcutsModal(true)
      return
    }

  }, [transport, tracks, ui])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
