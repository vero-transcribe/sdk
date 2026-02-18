import { VeroTranscribe } from '../src'

/**
 * Creates a test client using environment variables.
 * Set VERO_API_KEY and optionally VERO_BASE_URL to run E2E tests.
 */
export function createTestClient(): VeroTranscribe {
  const apiKey = process.env.VERO_API_KEY
  if (!apiKey) {
    throw new Error('VERO_API_KEY environment variable is required for E2E tests')
  }

  return new VeroTranscribe({
    apiKey,
    baseUrl: process.env.VERO_BASE_URL || 'https://api.verotranscribe.com',
  })
}

/**
 * Check if E2E tests should be skipped (no API key configured)
 */
export function shouldSkipE2E(): boolean {
  return !process.env.VERO_API_KEY
}

/**
 * Skip message for E2E tests
 */
export const SKIP_E2E_MESSAGE = 'Skipping E2E test: VERO_API_KEY not set'

/**
 * A short test audio URL for transcription tests
 * Using Mozilla's public audio sample with correct MIME type
 */
export const TEST_AUDIO_URL = 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg'

/**
 * Create a small test audio blob for upload tests
 */
export function createTestAudioBlob(): Blob {
  // Create a minimal WAV file header for testing
  // This won't produce meaningful transcription but tests the upload flow
  const header = new Uint8Array([
    0x52, 0x49, 0x46, 0x46, // "RIFF"
    0x24, 0x00, 0x00, 0x00, // File size - 8
    0x57, 0x41, 0x56, 0x45, // "WAVE"
    0x66, 0x6d, 0x74, 0x20, // "fmt "
    0x10, 0x00, 0x00, 0x00, // Subchunk1 size
    0x01, 0x00, // Audio format (PCM)
    0x01, 0x00, // Number of channels
    0x44, 0xac, 0x00, 0x00, // Sample rate (44100)
    0x88, 0x58, 0x01, 0x00, // Byte rate
    0x02, 0x00, // Block align
    0x10, 0x00, // Bits per sample
    0x64, 0x61, 0x74, 0x61, // "data"
    0x00, 0x00, 0x00, 0x00, // Data size
  ])
  return new Blob([header], { type: 'audio/wav' })
}

/**
 * Helper to wait for a short delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
