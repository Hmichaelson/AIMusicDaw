import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Project } from '@/types'
import { DEFAULT_BPM, DEFAULT_SAMPLE_RATE, DEFAULT_TIME_SIGNATURE } from '@/config/constants'

interface ProjectStore {
  project: Project | null
  isDirty: boolean

  // Actions
  createProject: (name?: string) => void
  updateProject: (updates: Partial<Project>) => void
  setDirty: (dirty: boolean) => void
  setBpm: (bpm: number) => void
  setTimeSignature: (timeSignature: [number, number]) => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
  project: null,
  isDirty: false,

  createProject: (name = 'Untitled Project') => {
    const project: Project = {
      id: uuidv4(),
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
      sampleRate: DEFAULT_SAMPLE_RATE,
      bpm: DEFAULT_BPM,
      timeSignature: DEFAULT_TIME_SIGNATURE,
    }
    set({ project, isDirty: false })
  },

  updateProject: (updates) => {
    set((state) => ({
      project: state.project
        ? { ...state.project, ...updates, updatedAt: new Date() }
        : null,
      isDirty: true,
    }))
  },

  setDirty: (dirty) => set({ isDirty: dirty }),

  setBpm: (bpm) => {
    set((state) => ({
      project: state.project
        ? { ...state.project, bpm, updatedAt: new Date() }
        : null,
      isDirty: true,
    }))
  },

  setTimeSignature: (timeSignature) => {
    set((state) => ({
      project: state.project
        ? { ...state.project, timeSignature, updatedAt: new Date() }
        : null,
      isDirty: true,
    }))
  },
}))
