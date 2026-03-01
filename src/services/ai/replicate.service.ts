import type { StemResult, StemType } from '@/types'
import { GENERATION_POLL_INTERVAL } from '@/config/constants'

interface ReplicatePrediction {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output?: Record<string, string>
  error?: string
  logs?: string
}

/**
 * Service for interacting with Replicate API (for Demucs stem separation)
 */
class ReplicateService {
  private baseUrl = 'https://api.replicate.com/v1'
  private apiKey: string
  // Demucs model on Replicate
  private modelVersion: string

  constructor() {
    this.apiKey = import.meta.env.VITE_REPLICATE_API_KEY || ''
    this.modelVersion = 'cjwbw/demucs:25a173108cff36ef9f80f854c162d01df9e6528be175794b81571db5cb7f13c9'
  }

  /**
   * Check if the service is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey
  }

  /**
   * Separate stems from audio file
   */
  async separateStems(
    audioUrl: string,
    onProgress?: (progress: number) => void
  ): Promise<StemResult[]> {
    if (!this.isConfigured()) {
      throw new Error('Replicate API key not configured. Please set VITE_REPLICATE_API_KEY in your .env file.')
    }

    // Create prediction
    const response = await fetch(`${this.baseUrl}/predictions`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: this.modelVersion.split(':')[1],
        input: {
          audio: audioUrl,
          // Demucs options
          // stem: 'all' // vocals, drums, bass, other
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Replicate API error: ${error}`)
    }

    const prediction = await response.json()

    // Poll for completion
    return this.pollForStems(prediction.id, onProgress)
  }

  /**
   * Poll for stem separation results
   */
  private async pollForStems(
    predictionId: string,
    onProgress?: (progress: number) => void
  ): Promise<StemResult[]> {
    const maxAttempts = 180 // 9 minutes max
    let lastProgress = 0

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const prediction = await this.getPrediction(predictionId)

      // Estimate progress based on status and attempt
      if (onProgress) {
        if (prediction.status === 'starting') {
          lastProgress = Math.min(10, lastProgress + 2)
        } else if (prediction.status === 'processing') {
          lastProgress = Math.min(90, lastProgress + 2)
        }
        onProgress(lastProgress)
      }

      if (prediction.status === 'succeeded' && prediction.output) {
        if (onProgress) onProgress(100)
        return this.parseStems(prediction.output)
      }

      if (prediction.status === 'failed') {
        throw new Error(prediction.error || 'Stem separation failed')
      }

      if (prediction.status === 'canceled') {
        throw new Error('Stem separation was canceled')
      }

      await this.sleep(GENERATION_POLL_INTERVAL)
    }

    throw new Error('Stem separation timed out')
  }

  /**
   * Get prediction status
   */
  private async getPrediction(predictionId: string): Promise<ReplicatePrediction> {
    const response = await fetch(`${this.baseUrl}/predictions/${predictionId}`, {
      headers: {
        'Authorization': `Token ${this.apiKey}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get prediction: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Parse Demucs output into StemResult array
   */
  private parseStems(output: Record<string, string>): StemResult[] {
    const stemTypes: StemType[] = ['vocals', 'drums', 'bass', 'other']
    const results: StemResult[] = []

    for (const type of stemTypes) {
      if (output[type]) {
        results.push({
          type,
          audioUrl: output[type],
          duration: 0, // Duration will be determined when loading
        })
      }
    }

    return results
  }

  /**
   * Cancel a prediction
   */
  async cancel(predictionId: string): Promise<void> {
    await fetch(`${this.baseUrl}/predictions/${predictionId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.apiKey}`,
      },
    })
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export const replicateService = new ReplicateService()
