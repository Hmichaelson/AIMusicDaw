import { useState, useCallback, useRef } from 'react'
import { Sparkles, Music, Scissors, ChevronDown, ChevronRight, Upload, X, AlertCircle } from 'lucide-react'
import { useAIStore, useTracksStore } from '@/store'
import { aiService } from '@/services/ai'
import { audioEngine } from '@/services/audio'
import { getAudioDuration } from '@/utils'

interface SidebarSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

function SidebarSection({ title, icon, children, defaultOpen = true }: SidebarSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-daw-border">
      <button
        className="w-full px-4 py-3 flex items-center gap-2 hover:bg-daw-surface-light transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {icon}
        <span className="font-medium text-sm">{title}</span>
        <div className="flex-1" />
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

export function Sidebar() {
  const {
    activeProvider,
    setActiveProvider,
    isGenerating,
    generationJobs,
    startGeneration,
    updateGenerationStatus,
    completeGeneration,
    failGeneration,
    removeGenerationJob,
  } = useAIStore()

  const { addTrack, addClip } = useTracksStore()

  const [prompt, setPrompt] = useState('')
  const [isInstrumental, setIsInstrumental] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return

    setError(null)

    // Check if provider is configured
    if (!aiService.isProviderConfigured(activeProvider)) {
      setError(`${activeProvider} API key not configured. Add VITE_${activeProvider.toUpperCase()}_API_KEY to your .env file.`)
      return
    }

    // Start the generation job
    const jobId = startGeneration(prompt, {
      provider: activeProvider,
      instrumental: isInstrumental,
    })

    try {
      updateGenerationStatus(jobId, 'generating', 10)

      const result = await aiService.generateMusic(
        activeProvider,
        prompt,
        { provider: activeProvider, instrumental: isInstrumental },
        (progress) => {
          updateGenerationStatus(jobId, 'generating', progress)
        }
      )

      completeGeneration(jobId, {
        audioUrl: result.audioUrl,
        duration: result.duration,
        title: result.title,
      })

      setPrompt('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed'
      failGeneration(jobId, message)
      setError(message)
    }
  }, [prompt, activeProvider, isInstrumental, startGeneration, updateGenerationStatus, completeGeneration, failGeneration])

  const handleImportGenerated = useCallback(async (jobId: string) => {
    const job = generationJobs.find(j => j.id === jobId)
    if (!job?.result) return

    try {
      // Initialize audio engine if needed
      if (!audioEngine.isReady()) {
        await audioEngine.initialize()
      }

      // Get duration
      const duration = job.result.duration || await getAudioDuration(job.result.audioUrl)

      // Create a new track for the generated audio
      const trackName = job.result.title || `AI: ${job.prompt.slice(0, 20)}...`
      const trackId = addTrack(trackName)

      // Add clip to the track
      const clipId = addClip(trackId, {
        name: trackName,
        audioUrl: job.result.audioUrl,
        startTime: 0,
        duration,
        offset: 0,
        fadeIn: 0,
        fadeOut: 0,
        gain: 1,
      })

      // Load into audio engine
      await audioEngine.loadClip(clipId, job.result.audioUrl)
      audioEngine.scheduleClip(clipId, trackId, 0, 0, duration, 1)

      // Remove from completed jobs
      removeGenerationJob(jobId)
    } catch (err) {
      console.error('Failed to import generated audio:', err)
      setError('Failed to import audio')
    }
  }, [generationJobs, addTrack, addClip, removeGenerationJob])

  const handleStemSeparation = useCallback(async (file: File) => {
    if (!aiService.isStemSeparationConfigured()) {
      setError('Replicate API key not configured. Add VITE_REPLICATE_API_KEY to your .env file.')
      return
    }

    setError(null)

    try {
      // For real implementation, we'd need to upload the file to a public URL
      // For now, show a helpful message
      alert(`Stem separation for "${file.name}" requires uploading to a public URL.\n\nIn production, this would:\n1. Upload your audio to cloud storage\n2. Send the URL to Demucs via Replicate\n3. Import the separated stems as individual tracks`)

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Stem separation failed'
      setError(message)
    }
  }, [])

  const pendingJobs = generationJobs.filter(
    (j) => j.status === 'pending' || j.status === 'generating'
  )
  const completedJobs = generationJobs.filter((j) => j.status === 'completed')
  const failedJobs = generationJobs.filter((j) => j.status === 'failed')

  return (
    <aside className="w-[300px] bg-daw-surface border-r border-daw-border flex flex-col overflow-hidden">
      {/* AI Generation Section */}
      <SidebarSection
        title="AI Generate"
        icon={<Sparkles size={18} className="text-daw-accent" />}
      >
        {/* Error display */}
        {error && (
          <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400 flex items-start gap-2">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
            <button onClick={() => setError(null)}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Provider Selection */}
        <div className="mb-3">
          <label className="text-xs text-daw-text-muted mb-1 block">Provider</label>
          <div className="flex gap-1">
            {(['suno', 'udio'] as const).map((provider) => (
              <button
                key={provider}
                className={`flex-1 py-1.5 px-3 rounded text-sm capitalize transition-colors ${
                  activeProvider === provider
                    ? 'bg-daw-accent text-white'
                    : 'bg-daw-surface-light text-daw-text-muted hover:text-daw-text'
                }`}
                onClick={() => setActiveProvider(provider)}
              >
                {provider}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input */}
        <div className="mb-3">
          <label className="text-xs text-daw-text-muted mb-1 block">Prompt</label>
          <textarea
            className="input w-full h-24 resize-none text-sm"
            placeholder="A chill lo-fi hip hop beat with jazzy piano chords and vinyl crackle..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        {/* Options */}
        <div className="mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-daw-border bg-daw-surface"
              checked={isInstrumental}
              onChange={(e) => setIsInstrumental(e.target.checked)}
            />
            <span className="text-sm">Instrumental only</span>
          </label>
        </div>

        {/* Generate Button */}
        <button
          className="btn btn-primary w-full flex items-center justify-center gap-2"
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Generate Music
            </>
          )}
        </button>

        {/* Generation Queue */}
        {pendingJobs.length > 0 && (
          <div className="mt-3">
            <div className="text-xs text-daw-text-muted mb-2">
              Generating ({pendingJobs.length})
            </div>
            {pendingJobs.map((job) => (
              <div
                key={job.id}
                className="bg-daw-surface-light rounded p-2 mb-2 text-sm"
              >
                <div className="truncate text-daw-text">{job.prompt}</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 bg-daw-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-daw-accent transition-all"
                      style={{ width: `${job.progress || 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-daw-text-muted">
                    {job.progress || 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Failed Jobs */}
        {failedJobs.length > 0 && (
          <div className="mt-3">
            <div className="text-xs text-red-400 mb-2">
              Failed ({failedJobs.length})
            </div>
            {failedJobs.slice(0, 2).map((job) => (
              <div
                key={job.id}
                className="bg-red-500/10 border border-red-500/20 rounded p-2 mb-2 text-sm"
              >
                <div className="truncate text-daw-text">{job.prompt}</div>
                <div className="text-xs text-red-400 mt-1">{job.error}</div>
                <button
                  className="text-xs text-daw-text-muted hover:text-daw-text mt-1"
                  onClick={() => removeGenerationJob(job.id)}
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Completed */}
        {completedJobs.length > 0 && (
          <div className="mt-3">
            <div className="text-xs text-daw-text-muted mb-2">
              Ready to import ({completedJobs.length})
            </div>
            {completedJobs.slice(0, 3).map((job) => (
              <div
                key={job.id}
                className="bg-daw-surface-light rounded p-2 mb-2 text-sm flex items-center gap-2"
              >
                <Music size={14} className="text-daw-success flex-shrink-0" />
                <div className="flex-1 truncate">{job.result?.title || job.prompt}</div>
                <button
                  className="text-daw-accent text-xs hover:underline"
                  onClick={() => handleImportGenerated(job.id)}
                >
                  Import
                </button>
              </div>
            ))}
          </div>
        )}
      </SidebarSection>

      {/* Stem Separation Section */}
      <SidebarSection
        title="Stem Separation"
        icon={<Scissors size={18} className="text-purple-400" />}
        defaultOpen={false}
      >
        <p className="text-sm text-daw-text-muted mb-3">
          Separate audio into vocals, drums, bass, and other using AI.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleStemSeparation(file)
          }}
        />

        <div
          className="border-2 border-dashed border-daw-border rounded-lg p-6 text-center cursor-pointer hover:border-daw-accent hover:bg-daw-surface-light/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDrop={(e) => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (file) handleStemSeparation(file)
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <Upload size={24} className="mx-auto text-daw-text-muted mb-2" />
          <p className="text-sm text-daw-text-muted">
            Drop audio file or click to upload
          </p>
        </div>
      </SidebarSection>

      {/* Spacer */}
      <div className="flex-1" />

      {/* API Status */}
      <div className="p-4 border-t border-daw-border">
        <div className="text-xs text-daw-text-muted">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${aiService.isProviderConfigured('suno') ? 'bg-daw-success' : 'bg-daw-error'}`} />
            Suno API: {aiService.isProviderConfigured('suno') ? 'Configured' : 'Not configured'}
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${aiService.isStemSeparationConfigured() ? 'bg-daw-success' : 'bg-daw-error'}`} />
            Demucs: {aiService.isStemSeparationConfigured() ? 'Configured' : 'Not configured'}
          </div>
        </div>
      </div>
    </aside>
  )
}
