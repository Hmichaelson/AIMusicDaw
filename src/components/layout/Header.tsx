import { Save, Download, Settings, HelpCircle } from 'lucide-react'
import { useProjectStore, useUIStore } from '@/store'

export function Header() {
  const { project, isDirty } = useProjectStore()
  const { setShowExportModal, setShowSettingsModal, setShowShortcutsModal } = useUIStore()

  return (
    <header className="h-12 bg-daw-surface border-b border-daw-border flex items-center px-4 gap-4">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-daw-accent to-purple-500 flex items-center justify-center">
          <span className="text-white font-bold text-sm">AI</span>
        </div>
        <span className="font-semibold text-daw-text">Music DAW</span>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-daw-border" />

      {/* Project Name */}
      <div className="flex items-center gap-2">
        <span className="text-daw-text">
          {project?.name || 'Untitled Project'}
        </span>
        {isDirty && (
          <span className="text-daw-text-muted text-sm">*</span>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          className="btn-icon"
          title="Save Project (Cmd+S)"
          onClick={() => {
            // TODO: Implement save
            console.log('Save project')
          }}
        >
          <Save size={18} />
        </button>

        <button
          className="btn-icon"
          title="Export Audio (Cmd+Shift+E)"
          onClick={() => setShowExportModal(true)}
        >
          <Download size={18} />
        </button>

        <div className="w-px h-6 bg-daw-border mx-1" />

        <button
          className="btn-icon"
          title="Keyboard Shortcuts (?)"
          onClick={() => setShowShortcutsModal(true)}
        >
          <HelpCircle size={18} />
        </button>

        <button
          className="btn-icon"
          title="Settings"
          onClick={() => setShowSettingsModal(true)}
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  )
}
