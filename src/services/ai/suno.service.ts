import type { GenerationSettings } from '@/types'
import { GENERATION_POLL_INTERVAL } from '@/config/constants'

interface SunoGenerationResult {
  audioUrl: string
  duration: number
  title?: string
}

interface SunoTaskStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  audio_url?: string
  duration?: number
  title?: string
  error?: string
  progress?: number
}

/**
 * Service for interacting with Suno API (via third-party providers)
 */
class SunoService {
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.baseUrl = import.meta.env.VITE_SUNO_API_URL || 'https://api.sunoapi.org'
    this.apiKey = import.meta.env.VITE_SUNO_API_KEY || ''
  }

  /**
   * Check if the service is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey
  }

  /**
   * Generate music from a text prompt
   */
  async generateMusic(
    prompt: string,
    settings: GenerationSettings,
    onProgress?: (progress: number) => void
  ): Promise<SunoGenerationResult> {
    if (!this.isConfigured()) {
      throw new Error('Suno API key not configured. Please set VITE_SUNO_API_KEY in your .env file.')
    }

    // Start generation
    const response = await fetch(`${this.baseUrl}/v1/music/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        prompt,
        make_instrumental: settings.instrumental ?? false,
        duration: settings.duration,
        style: settings.style,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Suno API error: ${error}`)
    }

    const data = await response.json()
    const taskId = data.task_id || data.id

    // Poll for completion
    return this.pollForResult(taskId, onProgress)
  }

  /**
   * Poll for generation result
   */
  private async pollForResult(
    taskId: string,
    onProgress?: (progress: number) => void
  ): Promise<SunoGenerationResult> {
    const maxAttempts = 120 // 6 minutes max (with 3s intervals)

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.getTaskStatus(taskId)

      if (onProgress && status.progress !== undefined) {
        onProgress(status.progress)
      }

      if (status.status === 'completed' && status.audio_url) {
        return {
          audioUrl: status.audio_url,
          duration: status.duration || 0,
          title: status.title,
        }
      }

      if (status.status === 'failed') {
        throw new Error(status.error || 'Generation failed')
      }

      await this.sleep(GENERATION_POLL_INTERVAL)
    }

    throw new Error('Generation timed out')
  }

  /**
   * Get task status
   */
  private async getTaskStatus(taskId: string): Promise<SunoTaskStatus> {
    const response = await fetch(`${this.baseUrl}/v1/music/status/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get task status: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Cancel a generation job
   */
  async cancel(taskId: string): Promise<void> {
    await fetch(`${this.baseUrl}/v1/music/cancel/${taskId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    })
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export const sunoService = new SunoService()
