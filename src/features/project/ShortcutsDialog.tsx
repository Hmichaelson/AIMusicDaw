import { Modal } from '@/components/common'
import { useUIStore } from '@/store'
import { KEYBOARD_SHORTCUTS, formatShortcut } from '@/config/shortcuts'

export function ShortcutsDialog() {
  const { showShortcutsModal, setShowShortcutsModal } = useUIStore()

  // Group shortcuts by category
  const categories = {
    'Transport': KEYBOARD_SHORTCUTS.filter(s => s.action.startsWith('transport')),
    'Navigation': KEYBOARD_SHORTCUTS.filter(s =>
      s.action.includes('goTo') || s.action.includes('nudge')
    ),
    'Zoom': KEYBOARD_SHORTCUTS.filter(s => s.action.startsWith('timeline.zoom')),
    'Editing': KEYBOARD_SHORTCUTS.filter(s => s.action.startsWith('edit')),
    'Tracks': KEYBOARD_SHORTCUTS.filter(s => s.action.startsWith('track')),
    'Project': KEYBOARD_SHORTCUTS.filter(s => s.action.startsWith('project')),
    'UI': KEYBOARD_SHORTCUTS.filter(s => s.action.startsWith('ui')),
  }

  return (
    <Modal
      isOpen={showShortcutsModal}
      onClose={() => setShowShortcutsModal(false)}
      title="Keyboard Shortcuts"
      size="lg"
    >
      <div className="grid grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto">
        {Object.entries(categories).map(([category, shortcuts]) => (
          shortcuts.length > 0 && (
            <div key={category}>
              <h3 className="text-sm font-semibold text-daw-text-muted mb-2">
                {category}
              </h3>
              <div className="space-y-1">
                {shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.action}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <kbd className="px-2 py-0.5 bg-daw-surface-light rounded text-xs font-mono">
                      {formatShortcut(shortcut)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-daw-border text-center">
        <p className="text-sm text-daw-text-muted">
          Press <kbd className="px-1.5 py-0.5 bg-daw-surface-light rounded text-xs font-mono">?</kbd> anytime to show this dialog
        </p>
      </div>
    </Modal>
  )
}
