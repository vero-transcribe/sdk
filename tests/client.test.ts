import { describe, it, expect } from 'vitest'
import { VeroTranscribe, VeroAPIError } from '../src'

describe('VeroTranscribe', () => {
  describe('constructor', () => {
    it('creates client with apiKey', () => {
      const client = new VeroTranscribe({
        apiKey: 'test_api_key',
      })

      expect(client).toBeDefined()
      expect(client.transcriptions).toBeDefined()
      expect(client.webhooks).toBeDefined()
      expect(client.usage).toBeDefined()
    })

    it('throws error without apiKey', () => {
      expect(() => {
        // @ts-expect-error - Testing runtime validation
        new VeroTranscribe({})
      }).toThrow('API key is required')
    })

    it('throws error with empty apiKey', () => {
      expect(() => {
        new VeroTranscribe({
          apiKey: '',
        })
      }).toThrow('API key is required')
    })

    it('accepts custom baseUrl', () => {
      const client = new VeroTranscribe({
        apiKey: 'test_api_key',
        baseUrl: 'https://custom.api.com',
      })

      expect(client).toBeDefined()
    })

    it('accepts custom timeout', () => {
      const client = new VeroTranscribe({
        apiKey: 'test_api_key',
        timeout: 60000,
      })

      expect(client).toBeDefined()
    })
  })

  describe('resources', () => {
    it('exposes transcriptions resource', () => {
      const client = new VeroTranscribe({
        apiKey: 'test_api_key',
      })

      expect(client.transcriptions).toBeDefined()
      expect(typeof client.transcriptions.create).toBe('function')
      expect(typeof client.transcriptions.get).toBe('function')
      expect(typeof client.transcriptions.list).toBe('function')
      expect(typeof client.transcriptions.delete).toBe('function')
      expect(typeof client.transcriptions.upload).toBe('function')
      expect(typeof client.transcriptions.transcribe).toBe('function')
      expect(typeof client.transcriptions.transcribeFile).toBe('function')
      expect(typeof client.transcriptions.waitForCompletion).toBe('function')
      expect(typeof client.transcriptions.bulkUpload).toBe('function')
      expect(typeof client.transcriptions.bulkTranscribe).toBe('function')
      expect(typeof client.transcriptions.waitForBatch).toBe('function')
    })

    it('exposes webhooks resource', () => {
      const client = new VeroTranscribe({
        apiKey: 'test_api_key',
      })

      expect(client.webhooks).toBeDefined()
      expect(typeof client.webhooks.create).toBe('function')
      expect(typeof client.webhooks.get).toBe('function')
      expect(typeof client.webhooks.list).toBe('function')
      expect(typeof client.webhooks.update).toBe('function')
      expect(typeof client.webhooks.delete).toBe('function')
      expect(typeof client.webhooks.deliveries).toBe('function')
    })

    it('exposes usage resource', () => {
      const client = new VeroTranscribe({
        apiKey: 'test_api_key',
      })

      expect(client.usage).toBeDefined()
      expect(typeof client.usage.get).toBe('function')
      expect(typeof client.usage.history).toBe('function')
    })
  })
})

describe('VeroAPIError', () => {
  it('creates error with all properties', () => {
    const error = new VeroAPIError('Test error message', 'test_code', 400)

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(VeroAPIError)
    expect(error.message).toBe('Test error message')
    expect(error.code).toBe('test_code')
    expect(error.status).toBe(400)
    expect(error.name).toBe('VeroAPIError')
  })

  it('is catchable as Error', () => {
    const error = new VeroAPIError('Test', 'test', 500)

    expect(() => {
      throw error
    }).toThrow(Error)
  })

  it('is catchable as VeroAPIError', () => {
    const error = new VeroAPIError('Test', 'test', 500)

    expect(() => {
      throw error
    }).toThrow(VeroAPIError)
  })
})
