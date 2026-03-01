/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUNO_API_URL: string
  readonly VITE_SUNO_API_KEY: string
  readonly VITE_REPLICATE_API_KEY: string
  readonly VITE_UDIO_API_URL: string
  readonly VITE_UDIO_API_KEY: string
  readonly VITE_STABLE_AUDIO_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
