import { describe, it, expect } from 'vitest'
import { createHmac } from 'crypto'
import { createWebhookVerifier } from '../src'

describe('createWebhookVerifier', () => {
  const secret = 'whsec_test_secret_key_12345'

  // Helper to create a valid signature
  function createSignature(body: string, timestamp: string, secretKey: string): string {
    const payload = `${timestamp}.${body}`
    const hash = createHmac('sha256', secretKey).update(payload).digest('hex')
    return `sha256=${hash}`
  }

  describe('verify()', () => {
    it('returns true for valid signature', async () => {
      const verifier = createWebhookVerifier(secret)
      const body = JSON.stringify({ event: 'transcription.completed', data: { id: '123' } })
      const timestamp = '1704067200' // Jan 1, 2024

      const signature = createSignature(body, timestamp, secret)

      const isValid = await verifier.verify(body, signature, timestamp)

      expect(isValid).toBe(true)
    })

    it('returns false for invalid signature', async () => {
      const verifier = createWebhookVerifier(secret)
      const body = JSON.stringify({ event: 'transcription.completed', data: { id: '123' } })
      const timestamp = '1704067200'

      const isValid = await verifier.verify(body, 'sha256=invalid_signature', timestamp)

      expect(isValid).toBe(false)
    })

    it('returns false for wrong secret', async () => {
      const verifier = createWebhookVerifier(secret)
      const body = JSON.stringify({ event: 'transcription.completed', data: { id: '123' } })
      const timestamp = '1704067200'

      // Create signature with different secret
      const signature = createSignature(body, timestamp, 'wrong_secret')

      const isValid = await verifier.verify(body, signature, timestamp)

      expect(isValid).toBe(false)
    })

    it('returns false for tampered body', async () => {
      const verifier = createWebhookVerifier(secret)
      const originalBody = JSON.stringify({ event: 'transcription.completed', data: { id: '123' } })
      const tamperedBody = JSON.stringify({ event: 'transcription.completed', data: { id: '456' } })
      const timestamp = '1704067200'

      // Create signature with original body
      const signature = createSignature(originalBody, timestamp, secret)

      // Verify with tampered body
      const isValid = await verifier.verify(tamperedBody, signature, timestamp)

      expect(isValid).toBe(false)
    })

    it('returns false for wrong timestamp', async () => {
      const verifier = createWebhookVerifier(secret)
      const body = JSON.stringify({ event: 'transcription.completed', data: { id: '123' } })
      const originalTimestamp = '1704067200'
      const wrongTimestamp = '1704067300'

      // Create signature with original timestamp
      const signature = createSignature(body, originalTimestamp, secret)

      // Verify with wrong timestamp
      const isValid = await verifier.verify(body, signature, wrongTimestamp)

      expect(isValid).toBe(false)
    })

    it('handles empty body', async () => {
      const verifier = createWebhookVerifier(secret)
      const body = ''
      const timestamp = '1704067200'

      const signature = createSignature(body, timestamp, secret)

      const isValid = await verifier.verify(body, signature, timestamp)

      expect(isValid).toBe(true)
    })

    it('handles complex JSON body', async () => {
      const verifier = createWebhookVerifier(secret)
      const body = JSON.stringify({
        event: 'transcription.completed',
        data: {
          id: 'tr_abc123',
          status: 'completed',
          transcript: {
            text: 'Hello, world!',
            segments: [
              { speaker: 'A', text: 'Hello', start: 0, end: 1 },
              { speaker: 'B', text: 'World', start: 1, end: 2 },
            ],
          },
          analysis: {
            summary: 'A conversation',
            keyPhrases: ['hello', 'world'],
          },
        },
      })
      const timestamp = '1704067200'

      const signature = createSignature(body, timestamp, secret)

      const isValid = await verifier.verify(body, signature, timestamp)

      expect(isValid).toBe(true)
    })

    it('handles unicode characters in body', async () => {
      const verifier = createWebhookVerifier(secret)
      const body = JSON.stringify({
        event: 'transcription.completed',
        data: {
          transcript: {
            text: '你好世界 שלום עולם',
          },
        },
      })
      const timestamp = '1704067200'

      const signature = createSignature(body, timestamp, secret)

      const isValid = await verifier.verify(body, signature, timestamp)

      expect(isValid).toBe(true)
    })

    it('handles special characters in body', async () => {
      const verifier = createWebhookVerifier(secret)
      const body = JSON.stringify({
        event: 'transcription.completed',
        data: {
          transcript: {
            text: 'Hello! @#$%^&*()_+-={}[]|\\:";\'<>?,./`~',
          },
        },
      })
      const timestamp = '1704067200'

      const signature = createSignature(body, timestamp, secret)

      const isValid = await verifier.verify(body, signature, timestamp)

      expect(isValid).toBe(true)
    })
  })

  describe('signature format', () => {
    it('expects sha256= prefix in signature', async () => {
      const verifier = createWebhookVerifier(secret)
      const body = JSON.stringify({ event: 'test' })
      const timestamp = '1704067200'

      // Create hash without prefix
      const hash = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')

      // Without prefix should fail
      const isValidWithoutPrefix = await verifier.verify(body, hash, timestamp)
      expect(isValidWithoutPrefix).toBe(false)

      // With prefix should pass
      const isValidWithPrefix = await verifier.verify(body, `sha256=${hash}`, timestamp)
      expect(isValidWithPrefix).toBe(true)
    })
  })
})
