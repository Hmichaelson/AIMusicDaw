import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type {
  AIGenerationJob,
  StemSeparationJob,
  GenerationSettings,
  GenerationStatus,
  StemResult,
  AIProvider,
} from '@/types'

interface AIStore {
  // Generation jobs
  generationJobs: AIGenerationJob[]
  stemJobs: StemSeparationJob[]
  isGenerating: boolean
  isSeparating: boolean

  // Active provider
  activeProvider: AIProvider

  // Actions
  setActiveProvider: (provider: AIProvider) => void

  // Generation actions
  startGeneration: (prompt: string, settings: GenerationSettings) => string
  updateGenerationStatus: (jobId: string, status: GenerationStatus, progress?: number) => void
  completeGeneration: (jobId: string, result: { audioUrl: string; duration: number; title?: string }) => void
  failGeneration: (jobId: string, error: string) => void
  removeGenerationJob: (jobId: string) => void
  clearCompletedGenerations: () => void

  // Stem separation actions
  startStemSeparation: (audioUrl: string) => string
  updateStemStatus: (jobId: string, status: GenerationStatus, progress?: number) => void
  completeStemSeparation: (jobId: string, results: StemResult[]) => void
  failStemSeparation: (jobId: string, error: string) => void
  removeStemJob: (jobId: string) => void

  // Helpers
  getGenerationJob: (jobId: string) => AIGenerationJob | undefined
  getStemJob: (jobId: string) => StemSeparationJob | undefined
  getPendingGenerations: () => AIGenerationJob[]
  getPendingStemJobs: () => StemSeparationJob[]
}

export const useAIStore = create<AIStore>((set, get) => ({
  generationJobs: [],
  stemJobs: [],
  isGenerating: false,
  isSeparating: false,
  activeProvider: 'suno',

  setActiveProvider: (provider) => set({ activeProvider: provider }),

  // Generation actions
  startGeneration: (prompt, settings) => {
    const jobId = uuidv4()
    const job: AIGenerationJob = {
      id: jobId,
      status: 'pending',
      prompt,
      settings,
      createdAt: new Date(),
      progress: 0,
    }

    set((state) => ({
      generationJobs: [...state.generationJobs, job],
      isGenerating: true,
    }))

    return jobId
  },

  updateGenerationStatus: (jobId, status, progress) => {
    set((state) => ({
      generationJobs: state.generationJobs.map((job) =>
        job.id === jobId
          ? { ...job, status, progress: progress ?? job.progress }
          : job
      ),
    }))
  },

  completeGeneration: (jobId, result) => {
    set((state) => {
      const updatedJobs = state.generationJobs.map((job) =>
        job.id === jobId
          ? { ...job, status: 'completed' as GenerationStatus, result, progress: 100 }
          : job
      )

      const stillGenerating = updatedJobs.some(
        (job) => job.status === 'pending' || job.status === 'generating'
      )

      return {
        generationJobs: updatedJobs,
        isGenerating: stillGenerating,
      }
    })
  },

  failGeneration: (jobId, error) => {
    set((state) => {
      const updatedJobs = state.generationJobs.map((job) =>
        job.id === jobId
          ? { ...job, status: 'failed' as GenerationStatus, error }
          : job
      )

      const stillGenerating = updatedJobs.some(
        (job) => job.status === 'pending' || job.status === 'generating'
      )

      return {
        generationJobs: updatedJobs,
        isGenerating: stillGenerating,
      }
    })
  },

  removeGenerationJob: (jobId) => {
    set((state) => ({
      generationJobs: state.generationJobs.filter((job) => job.id !== jobId),
    }))
  },

  clearCompletedGenerations: () => {
    set((state) => ({
      generationJobs: state.generationJobs.filter(
        (job) => job.status !== 'completed' && job.status !== 'failed'
      ),
    }))
  },

  // Stem separation actions
  startStemSeparation: (audioUrl) => {
    const jobId = uuidv4()
    const job: StemSeparationJob = {
      id: jobId,
      status: 'pending',
      sourceAudioUrl: audioUrl,
      createdAt: new Date(),
      progress: 0,
    }

    set((state) => ({
      stemJobs: [...state.stemJobs, job],
      isSeparating: true,
    }))

    return jobId
  },

  updateStemStatus: (jobId, status, progress) => {
    set((state) => ({
      stemJobs: state.stemJobs.map((job) =>
        job.id === jobId
          ? { ...job, status, progress: progress ?? job.progress }
          : job
      ),
    }))
  },

  completeStemSeparation: (jobId, results) => {
    set((state) => {
      const updatedJobs = state.stemJobs.map((job) =>
        job.id === jobId
          ? { ...job, status: 'completed' as GenerationStatus, results, progress: 100 }
          : job
      )

      const stillSeparating = updatedJobs.some(
        (job) => job.status === 'pending' || job.status === 'generating'
      )

      return {
        stemJobs: updatedJobs,
        isSeparating: stillSeparating,
      }
    })
  },

  failStemSeparation: (jobId, error) => {
    set((state) => {
      const updatedJobs = state.stemJobs.map((job) =>
        job.id === jobId
          ? { ...job, status: 'failed' as GenerationStatus, error }
          : job
      )

      const stillSeparating = updatedJobs.some(
        (job) => job.status === 'pending' || job.status === 'generating'
      )

      return {
        stemJobs: updatedJobs,
        isSeparating: stillSeparating,
      }
    })
  },

  removeStemJob: (jobId) => {
    set((state) => ({
      stemJobs: state.stemJobs.filter((job) => job.id !== jobId),
    }))
  },

  // Helpers
  getGenerationJob: (jobId) =>
    get().generationJobs.find((job) => job.id === jobId),

  getStemJob: (jobId) =>
    get().stemJobs.find((job) => job.id === jobId),

  getPendingGenerations: () =>
    get().generationJobs.filter(
      (job) => job.status === 'pending' || job.status === 'generating'
    ),

  getPendingStemJobs: () =>
    get().stemJobs.filter(
      (job) => job.status === 'pending' || job.status === 'generating'
    ),
}))
