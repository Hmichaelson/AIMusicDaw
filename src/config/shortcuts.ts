import type { KeyboardShortcut } from '@/types'

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // Transport
  {
    key: ' ',
    action: 'transport.playPause',
    description: 'Play / Pause',
  },
  {
    key: 'Enter',
    action: 'transport.stop',
    description: 'Stop and return to start',
  },
  {
    key: 'r',
    action: 'transport.record',
    description: 'Toggle recording',
  },
  {
    key: 'l',
    action: 'transport.toggleLoop',
    description: 'Toggle loop',
  },

  // Navigation
  {
    key: 'Home',
    action: 'transport.goToStart',
    description: 'Go to start',
  },
  {
    key: 'End',
    action: 'transport.goToEnd',
    description: 'Go to end',
  },
  {
    key: 'ArrowLeft',
    action: 'transport.nudgeLeft',
    description: 'Nudge playhead left',
  },
  {
    key: 'ArrowRight',
    action: 'transport.nudgeRight',
    description: 'Nudge playhead right',
  },

  // Zoom
  {
    key: '=',
    action: 'timeline.zoomIn',
    description: 'Zoom in',
  },
  {
    key: '-',
    action: 'timeline.zoomOut',
    description: 'Zoom out',
  },
  {
    key: '0',
    meta: true,
    action: 'timeline.zoomFit',
    description: 'Fit to window',
  },

  // Editing
  {
    key: 'Delete',
    action: 'edit.delete',
    description: 'Delete selected',
  },
  {
    key: 'Backspace',
    action: 'edit.delete',
    description: 'Delete selected',
  },
  {
    key: 'z',
    meta: true,
    action: 'edit.undo',
    description: 'Undo',
  },
  {
    key: 'z',
    meta: true,
    shift: true,
    action: 'edit.redo',
    description: 'Redo',
  },
  {
    key: 'y',
    meta: true,
    action: 'edit.redo',
    description: 'Redo',
  },
  {
    key: 'a',
    meta: true,
    action: 'edit.selectAll',
    description: 'Select all clips',
  },
  {
    key: 'd',
    meta: true,
    action: 'edit.duplicate',
    description: 'Duplicate selected',
  },
  {
    key: 'c',
    meta: true,
    action: 'edit.copy',
    description: 'Copy',
  },
  {
    key: 'v',
    meta: true,
    action: 'edit.paste',
    description: 'Paste',
  },
  {
    key: 'x',
    meta: true,
    action: 'edit.cut',
    description: 'Cut',
  },

  // Tracks
  {
    key: 't',
    meta: true,
    action: 'track.add',
    description: 'Add new track',
  },
  {
    key: 'm',
    action: 'track.mute',
    description: 'Mute selected track',
  },
  {
    key: 's',
    action: 'track.solo',
    description: 'Solo selected track',
  },

  // Project
  {
    key: 's',
    meta: true,
    action: 'project.save',
    description: 'Save project',
  },
  {
    key: 'o',
    meta: true,
    action: 'project.open',
    description: 'Open project',
  },
  {
    key: 'e',
    meta: true,
    shift: true,
    action: 'project.export',
    description: 'Export audio',
  },
  {
    key: 'i',
    meta: true,
    action: 'project.import',
    description: 'Import audio file',
  },

  // UI
  {
    key: '?',
    action: 'ui.showShortcuts',
    description: 'Show keyboard shortcuts',
  },
  {
    key: 'Escape',
    action: 'ui.deselect',
    description: 'Deselect all',
  },
]

// Helper to format shortcut for display
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = []

  if (shortcut.meta) {
    parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl')
  }
  if (shortcut.ctrl) {
    parts.push('Ctrl')
  }
  if (shortcut.alt) {
    parts.push(navigator.platform.includes('Mac') ? '⌥' : 'Alt')
  }
  if (shortcut.shift) {
    parts.push('⇧')
  }

  // Format special keys
  let keyDisplay = shortcut.key
  switch (shortcut.key) {
    case ' ':
      keyDisplay = 'Space'
      break
    case 'ArrowLeft':
      keyDisplay = '←'
      break
    case 'ArrowRight':
      keyDisplay = '→'
      break
    case 'ArrowUp':
      keyDisplay = '↑'
      break
    case 'ArrowDown':
      keyDisplay = '↓'
      break
    case 'Enter':
      keyDisplay = '↵'
      break
    case 'Backspace':
      keyDisplay = '⌫'
      break
    case 'Delete':
      keyDisplay = 'Del'
      break
    case 'Escape':
      keyDisplay = 'Esc'
      break
  }

  parts.push(keyDisplay.toUpperCase())

  return parts.join(' + ')
}
