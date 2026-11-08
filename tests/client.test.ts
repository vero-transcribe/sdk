import { describe, it, expect } from 'vitest'
import { VeroTranscribe, VeroAPIError } from '../src'

describe('VeroTranscribe', () => {
  describe('constructor', () => {
    it('creates client with apiKey and all resources', () => {
      const client = new VeroTranscribe({
        apiKey: 'test_api_key',
      })

      expect(client).toBeDefined()
      expect(client.transcriptions).toBeDefined()
      expect(client.webhooks).toBeDefined()
      expect(client.usage).toBeDefined()
      expect(client.meetings).toBeDefined()
      expect(client.subAccounts).toBeDefined()
      expect(client.packs).toBeDefined()
      expect(client.roles).toBeDefined()
      expect(client.scorecards).toBeDefined()
      expect(client.settings).toBeDefined()
      expect(client.evaluations).toBeDefined()
      expect(client.reports).toBeDefined()
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
        baseUrl: 'https://custom.api.com/',
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
    it('exposes transcriptions resource methods', () => {
      const client = new VeroTranscribe({ apiKey: 'test_api_key' })

      expect(typeof client.transcriptions.create).toBe('function')
      expect(typeof client.transcriptions.get).toBe('function')
      expect(typeof client.transcriptions.getAnalysis).toBe('function')
      expect(typeof client.transcriptions.getEvaluation).toBe('function')
      expect(typeof client.transcriptions.rerunEvaluation).toBe('function')
      expect(typeof client.transcriptions.list).toBe('function')
      expect(typeof client.transcriptions.delete).toBe('function')
      expect(typeof client.transcriptions.upload).toBe('function')
      expect(typeof client.transcriptions.transcribe).toBe('function')
      expect(typeof client.transcriptions.transcribeUrl).toBe('function')
      expect(typeof client.transcriptions.transcribeFile).toBe('function')
      expect(typeof client.transcriptions.waitForCompletion).toBe('function')
      expect(typeof client.transcriptions.bulkUpload).toBe('function')
      expect(typeof client.transcriptions.bulkTranscribe).toBe('function')
      expect(typeof client.transcriptions.waitForBatch).toBe('function')
    })

    it('exposes webhooks resource methods', () => {
      const client = new VeroTranscribe({ apiKey: 'test_api_key' })

      expect(typeof client.webhooks.create).toBe('function')
      expect(typeof client.webhooks.get).toBe('function')
      expect(typeof client.webhooks.list).toBe('function')
      expect(typeof client.webhooks.update).toBe('function')
      expect(typeof client.webhooks.delete).toBe('function')
      expect(typeof client.webhooks.deliveries).toBe('function')
    })

    it('exposes usage resource methods', () => {
      const client = new VeroTranscribe({ apiKey: 'test_api_key' })

      expect(typeof client.usage.get).toBe('function')
      expect(typeof client.usage.history).toBe('function')
    })

    it('exposes meetings resource methods', () => {
      const client = new VeroTranscribe({ apiKey: 'test_api_key' })

      expect(typeof client.meetings.sendBot).toBe('function')
      expect(typeof client.meetings.list).toBe('function')
      expect(typeof client.meetings.get).toBe('function')
      expect(typeof client.meetings.transcriptionCallback).toBe('function')
    })

    it('exposes subAccounts resource methods and nested sub-resources', () => {
      const client = new VeroTranscribe({ apiKey: 'test_api_key' })

      expect(typeof client.subAccounts.list).toBe('function')
      expect(typeof client.subAccounts.create).toBe('function')
      expect(typeof client.subAccounts.get).toBe('function')
      expect(typeof client.subAccounts.update).toBe('function')
      expect(typeof client.subAccounts.delete).toBe('function')
      expect(typeof client.subAccounts.listApiKeys).toBe('function')
      expect(typeof client.subAccounts.createApiKey).toBe('function')
      expect(typeof client.subAccounts.revokeApiKey).toBe('function')
      expect(typeof client.subAccounts.getUsage).toBe('function')
      expect(typeof client.subAccounts.listTranscriptions).toBe('function')
      expect(typeof client.subAccounts.transferBalance).toBe('function')
      expect(typeof client.subAccounts.getBalance).toBe('function')
      expect(typeof client.subAccounts.meetUsers).toBe('function')
      expect(typeof client.subAccounts.listMeetings).toBe('function')
      expect(typeof client.subAccounts.scorecards).toBe('function')
      expect(typeof client.subAccounts.updateAuditSettings).toBe('function')
      expect(typeof client.subAccounts.listEvaluations).toBe('function')
      expect(typeof client.subAccounts.getAuditReport).toBe('function')
      expect(typeof client.subAccounts.getTranscriptionEvaluation).toBe('function')
      expect(typeof client.subAccounts.rerunTranscriptionEvaluation).toBe('function')

      const meetUsers = client.subAccounts.meetUsers('acc_123')
      expect(typeof meetUsers.list).toBe('function')
      expect(typeof meetUsers.create).toBe('function')
      expect(typeof meetUsers.get).toBe('function')
      expect(typeof meetUsers.update).toBe('function')
      expect(typeof meetUsers.delete).toBe('function')

      const scorecards = client.subAccounts.scorecards('acc_123')
      expect(typeof scorecards.list).toBe('function')
      expect(typeof scorecards.create).toBe('function')
      expect(typeof scorecards.import).toBe('function')
      expect(typeof scorecards.get).toBe('function')
      expect(typeof scorecards.update).toBe('function')
      expect(typeof scorecards.replaceItems).toBe('function')
      expect(typeof scorecards.publish).toBe('function')
    })

    it('exposes packs, roles, scorecards, settings, evaluations, and reports resources', () => {
      const client = new VeroTranscribe({ apiKey: 'test_api_key' })

      expect(typeof client.packs.list).toBe('function')
      expect(typeof client.packs.get).toBe('function')
      expect(typeof client.packs.getDefaultScorecard).toBe('function')

      expect(typeof client.roles.list).toBe('function')
      expect(typeof client.roles.get).toBe('function')
      expect(typeof client.roles.create).toBe('function')
      expect(typeof client.roles.update).toBe('function')
      expect(typeof client.roles.delete).toBe('function')

      expect(typeof client.scorecards.list).toBe('function')
      expect(typeof client.scorecards.create).toBe('function')
      expect(typeof client.scorecards.get).toBe('function')
      expect(typeof client.scorecards.update).toBe('function')
      expect(typeof client.scorecards.delete).toBe('function')
      expect(typeof client.scorecards.replaceItems).toBe('function')
      expect(typeof client.scorecards.publish).toBe('function')
      expect(typeof client.scorecards.duplicate).toBe('function')
      expect(typeof client.scorecards.import).toBe('function')

      expect(typeof client.settings.getAudit).toBe('function')
      expect(typeof client.settings.updateAudit).toBe('function')

      expect(typeof client.evaluations.list).toBe('function')

      expect(typeof client.reports.audit).toBe('function')
      expect(typeof client.reports.auditNarrative).toBe('function')
      expect(typeof client.reports.compliance).toBe('function')
      expect(typeof client.reports.complianceXlsx).toBe('function')
    })
  })
})

describe('VeroAPIError', () => {
  it('creates error with all properties including optional details', () => {
    const details = [{ path: ['audioUrl'], message: 'Invalid url' }]
    const error = new VeroAPIError('Test error message', 'validation_error', 400, details)

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(VeroAPIError)
    expect(error.message).toBe('Test error message')
    expect(error.code).toBe('validation_error')
    expect(error.status).toBe(400)
    expect(error.details).toEqual(details)
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
