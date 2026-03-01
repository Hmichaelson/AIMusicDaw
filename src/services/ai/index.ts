import { sunoService } from './suno.service'
import { replicateService } from './replicate.service'
import type { GenerationSettings, StemResult, AIProvider } from '@/types'

interface GenerationResult {
  audioUrl: string
  duration: number
  title?: string
}

/**
 * AI Service Factory - unified interface for all AI services
 */
class AIServiceFactory {
  /**
   * Generate music using the specified provider
   */
  async generateMusic(
    provider: AIProvider,
    prompt: string,
    settings: GenerationSettings,
    onProgress?: (progress: number) => void
  ): Promise<GenerationResult> {
    switch (provider) {
      case 'suno':
        return sunoService.generateMusic(prompt, settings, onProgress)

      case 'udio':
        // TODO: Implement Udio service
        throw new Error('Udio provider not yet implemented')

      case 'stable-audio':
        // TODO: Implement Stable Audio service
        throw new Error('Stable Audio provider not yet implemented')

      default:
        throw new Error(`Unknown provider: ${provider}`)
    }
  }

  /**
   * Separate audio into stems using Demucs
   */
  async separateStems(
    audioUrl: string,
    onProgress?: (progress: number) => void
  ): Promise<StemResult[]> {
    return replicateService.separateStems(audioUrl, onProgress)
  }

  /**
   * Check if a provider is configured
   */
  isProviderConfigured(provider: AIProvider): boolean {
    switch (provider) {
      case 'suno':
        return sunoService.isConfigured()
      case 'udio':
        return false // Not implemented yet
      case 'stable-audio':
        return false // Not implemented yet
      default:
        return false
    }
  }

  /**
   * Check if stem separation is available
   */
  isStemSeparationConfigured(): boolean {
    return replicateService.isConfigured()
  }
}

export const aiService = new AIServiceFactory()
export { sunoService } from './suno.service'
export { replicateService } from './replicate.service'
