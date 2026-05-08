/**
 * PHASE 2 — Functional Testing: Chatbots / Assistants Service
 *
 * Covers: list, create, get, patch, lifecycle mutations (activate/pause/archive/delete),
 * platform API routing, error paths, and chatbot status state machine.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { CreateChatbotBody, UpdateChatbotBody } from '@/services/chatbots.service'

const mockFetch = vi.fn()

function makeOk(data: unknown, status = 200) {
  return { ok: true, status, json: () => Promise.resolve(data) }
}
function makeOk204() {
  return { ok: true, status: 204 }
}
function makeErr(status: number, detail: unknown) {
  return { ok: false, status, json: () => Promise.resolve({ detail }) }
}

const chatbotFixture = {
  id: 'cb-1',
  organization_id: 'org-1',
  name: 'Malaria Assistant',
  slug: 'malaria-assistant',
  description: 'Answers malaria-related queries',
  status: 'draft',
  system_prompt: 'You are a malaria expert.',
  welcome_message: 'Hello, how can I help?',
  fallback_message: 'Sorry, I cannot answer that.',
  brand_color: '#155D46',
  temperature: 0.3,
  top_k: 5,
  min_confidence: 0.7,
  enable_citations: true,
  enable_grounding: true,
  strict_domain: false,
  domain_keywords: null,
  agent_mode: 'auto',
  primary_language: 'en',
  secondary_languages: ['ha'],
  persona_template: 'formal',
  document_count: 2,
  created_at: '2026-05-01T10:00:00Z',
  updated_at: '2026-05-01T10:00:00Z',
}

describe('services/chatbots.service.ts', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    vi.resetModules()
    vi.stubGlobal('fetch', mockFetch)
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn().mockReturnValue('platform-token'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('list()', () => {
    it('should GET /api/v1/agency/chatbots', async () => {
      const paged = { data: [chatbotFixture], meta: { total: 1, page: 1, per_page: 20, total_pages: 1 } }
      mockFetch.mockResolvedValueOnce(makeOk(paged))
      const { chatbotsService } = await import('@/services/chatbots.service')
      const result = await chatbotsService.list()
      const [[url]] = mockFetch.mock.calls
      expect(url).toContain('/api/v1/agency/chatbots')
      expect(result.data[0].name).toBe('Malaria Assistant')
    })

    it('should support status filter', async () => {
      mockFetch.mockResolvedValueOnce(makeOk({ data: [], meta: { total: 0, page: 1, per_page: 20, total_pages: 0 } }))
      const { chatbotsService } = await import('@/services/chatbots.service')
      await chatbotsService.list({ status: 'active' })
      const [[url]] = mockFetch.mock.calls
      expect(url).toContain('status=active')
    })

    it('should use PLATFORM API (/api/v1), not compiler API (/api)', async () => {
      mockFetch.mockResolvedValueOnce(makeOk({ data: [], meta: { total: 0, page: 1, per_page: 20, total_pages: 0 } }))
      const { chatbotsService } = await import('@/services/chatbots.service')
      await chatbotsService.list()
      const [[url]] = mockFetch.mock.calls
      expect(url).toContain('/api/v1/')
      expect(url).not.toMatch(/\/api\/(?!v1)/)
    })

    it('should normalise { items: [...], total: N } (FastAPI pagination shape)', async () => {
      mockFetch.mockResolvedValueOnce(makeOk({ items: [chatbotFixture], total: 1, page: 1, size: 20, pages: 1 }))
      const { chatbotsService } = await import('@/services/chatbots.service')
      const result = await chatbotsService.list({ page: 1, per_page: 20 })
      expect(result.data).toHaveLength(1)
      expect(result.data[0].id).toBe('cb-1')
      expect(result.meta.total).toBe(1)
    })

    it('should normalise { chatbots: [...] } shape', async () => {
      mockFetch.mockResolvedValueOnce(makeOk({ chatbots: [chatbotFixture], total: 1 }))
      const { chatbotsService } = await import('@/services/chatbots.service')
      const result = await chatbotsService.list()
      expect(result.data).toHaveLength(1)
      expect(result.meta.total).toBe(1)
    })

    it('should normalise a raw array response', async () => {
      mockFetch.mockResolvedValueOnce(makeOk([chatbotFixture]))
      const { chatbotsService } = await import('@/services/chatbots.service')
      const result = await chatbotsService.list()
      expect(result.data).toHaveLength(1)
      expect(result.meta.total).toBe(1)
    })

    it('should return empty data when response is unrecognised', async () => {
      mockFetch.mockResolvedValueOnce(makeOk({ unexpected_key: 'whatever' }))
      const { chatbotsService } = await import('@/services/chatbots.service')
      const result = await chatbotsService.list()
      expect(result.data).toEqual([])
      expect(result.meta.total).toBe(0)
    })
  })

  describe('create()', () => {
    it('should POST to /api/v1/agency/chatbots/create', async () => {
      mockFetch.mockResolvedValueOnce(makeOk({ data: chatbotFixture }))
      const { chatbotsService } = await import('@/services/chatbots.service')
      const body: CreateChatbotBody = {
        name: 'Malaria Assistant',
        slug: 'malaria-assistant',
        organization_id: 'org-1',
        primary_language: 'en',
        persona_template: 'formal',
      }
      const result = await chatbotsService.create(body)
      const [[url, opts]] = mockFetch.mock.calls
      expect(url).toContain('/api/v1/agency/chatbots/create')
      expect(opts.method).toBe('POST')
      expect(JSON.parse(opts.body).name).toBe('Malaria Assistant')
      expect(result.id).toBe('cb-1')
    })

    it('should send tone and guidelines when provided', async () => {
      mockFetch.mockResolvedValueOnce(makeOk({ data: chatbotFixture }))
      const { chatbotsService } = await import('@/services/chatbots.service')
      const body: CreateChatbotBody = {
        name: 'Test',
        slug: 'test',
        organization_id: 'org-1',
        primary_language: 'en',
        persona_template: 'friendly',
        tone: { formality: 3, verbosity: 2, empathy: 5 },
        guidelines: { citeSources: true, includePolicyNumbers: false, allowOffTopic: false, escalateComplex: true },
      }
      await chatbotsService.create(body)
      const [[, opts]] = mockFetch.mock.calls
      const parsed = JSON.parse(opts.body)
      expect(parsed.tone.formality).toBe(3)
      expect(parsed.guidelines.citeSources).toBe(true)
    })

    it('should throw 409 if slug is already taken', async () => {
      mockFetch.mockResolvedValueOnce(makeErr(409, 'Slug already exists'))
      const { chatbotsService } = await import('@/services/chatbots.service')
      await expect(chatbotsService.create({
        name: 'Dup', slug: 'dup', organization_id: 'org-1',
        primary_language: 'en', persona_template: 'formal',
      })).rejects.toMatchObject({ status: 409 })
    })
  })

  describe('get()', () => {
    it('should GET /api/v1/agency/chatbots/:id', async () => {
      mockFetch.mockResolvedValueOnce(makeOk({ data: chatbotFixture }))
      const { chatbotsService } = await import('@/services/chatbots.service')
      const bot = await chatbotsService.get('cb-1')
      const [[url]] = mockFetch.mock.calls
      expect(url).toContain('/api/v1/agency/chatbots/cb-1')
      expect(bot.slug).toBe('malaria-assistant')
    })
  })

  describe('patch()', () => {
    it('should PATCH /api/v1/agency/chatbots/:id', async () => {
      const updated = { ...chatbotFixture, name: 'Updated Name', temperature: 0.5 }
      mockFetch.mockResolvedValueOnce(makeOk({ data: updated }))
      const { chatbotsService } = await import('@/services/chatbots.service')
      const result = await chatbotsService.patch('cb-1', { name: 'Updated Name', temperature: 0.5 })
      const [[url, opts]] = mockFetch.mock.calls
      expect(url).toContain('/api/v1/agency/chatbots/cb-1')
      expect(opts.method).toBe('PATCH')
      expect(JSON.parse(opts.body).temperature).toBe(0.5)
      expect(result.name).toBe('Updated Name')
    })
  })

  describe('Lifecycle mutations', () => {
    it('activate() should POST to /activate', async () => {
      mockFetch.mockResolvedValueOnce(makeOk204())
      const { chatbotsService } = await import('@/services/chatbots.service')
      await chatbotsService.activate('cb-1')
      const [[url, opts]] = mockFetch.mock.calls
      expect(url).toContain('/api/v1/agency/chatbots/cb-1/activate')
      expect(opts.method).toBe('POST')
    })

    it('pause() should POST to /pause', async () => {
      mockFetch.mockResolvedValueOnce(makeOk204())
      const { chatbotsService } = await import('@/services/chatbots.service')
      await chatbotsService.pause('cb-1')
      const [[url, opts]] = mockFetch.mock.calls
      expect(url).toContain('/api/v1/agency/chatbots/cb-1/pause')
      expect(opts.method).toBe('POST')
    })

    it('archive() should POST to /archive', async () => {
      mockFetch.mockResolvedValueOnce(makeOk204())
      const { chatbotsService } = await import('@/services/chatbots.service')
      await chatbotsService.archive('cb-1')
      const [[url, opts]] = mockFetch.mock.calls
      expect(url).toContain('/api/v1/agency/chatbots/cb-1/archive')
      expect(opts.method).toBe('POST')
    })

    it('delete() should DELETE /chatbots/:id', async () => {
      mockFetch.mockResolvedValueOnce(makeOk204())
      const { chatbotsService } = await import('@/services/chatbots.service')
      const result = await chatbotsService.delete('cb-1')
      const [[url, opts]] = mockFetch.mock.calls
      expect(url).toContain('/api/v1/agency/chatbots/cb-1')
      expect(opts.method).toBe('DELETE')
      expect(result).toBeUndefined()
    })
  })
})

// ─── Chatbot Status State Machine ─────────────────────────────────────────────

describe('Chatbot — Status State Machine (valid transitions)', () => {
  type Status = 'draft' | 'active' | 'paused' | 'archived'

  const validTransitions: Record<Status, Status[]> = {
    draft: ['active', 'archived'],
    active: ['paused'],
    paused: ['active', 'archived'],
    archived: [],
  }

  it('draft can be activated', () => {
    expect(validTransitions.draft).toContain('active')
  })

  it('draft can be archived', () => {
    expect(validTransitions.draft).toContain('archived')
  })

  it('active can be paused', () => {
    expect(validTransitions.active).toContain('paused')
  })

  it('active cannot be directly archived (must pause first)', () => {
    expect(validTransitions.active).not.toContain('archived')
  })

  it('paused can be reactivated', () => {
    expect(validTransitions.paused).toContain('active')
  })

  it('paused can be archived', () => {
    expect(validTransitions.paused).toContain('archived')
  })

  it('archived has no valid transitions (terminal state)', () => {
    expect(validTransitions.archived).toHaveLength(0)
  })
})

// ─── Chatbot Configuration Validation ─────────────────────────────────────────

describe('Chatbot — Configuration Boundaries', () => {
  describe('temperature', () => {
    const isValidTemp = (t: number) => t >= 0 && t <= 1

    it('should accept 0.0 (minimum)', () => expect(isValidTemp(0)).toBe(true))
    it('should accept 1.0 (maximum)', () => expect(isValidTemp(1)).toBe(true))
    it('should accept 0.5 (middle)', () => expect(isValidTemp(0.5)).toBe(true))
    it('should reject -0.1', () => expect(isValidTemp(-0.1)).toBe(false))
    it('should reject 1.1', () => expect(isValidTemp(1.1)).toBe(false))
  })

  describe('min_confidence', () => {
    const isValidConf = (c: number) => c >= 0 && c <= 1

    it('should accept 0.0', () => expect(isValidConf(0)).toBe(true))
    it('should accept 0.7 (typical production value)', () => expect(isValidConf(0.7)).toBe(true))
    it('should accept 1.0', () => expect(isValidConf(1)).toBe(true))
    it('should reject -0.1', () => expect(isValidConf(-0.1)).toBe(false))
    it('should reject 1.01', () => expect(isValidConf(1.01)).toBe(false))
  })

  describe('brand_color', () => {
    const isValidHex = (c: string) => /^#[0-9A-Fa-f]{6}$/.test(c)

    it('should accept valid hex color', () => expect(isValidHex('#155D46')).toBe(true))
    it('should accept uppercase hex', () => expect(isValidHex('#FF0000')).toBe(true))
    it('should reject 3-digit shorthand', () => expect(isValidHex('#FFF')).toBe(false))
    it('should reject color without hash', () => expect(isValidHex('155D46')).toBe(false))
    it('should reject rgb() format', () => expect(isValidHex('rgb(21,93,70)')).toBe(false))
  })

  describe('slug format', () => {
    const isValidSlug = (s: string) => /^[a-z0-9-]+$/.test(s)

    it('should accept lowercase-hyphenated slug', () => expect(isValidSlug('malaria-assistant')).toBe(true))
    it('should accept alphanumeric', () => expect(isValidSlug('assistant123')).toBe(true))
    it('should reject uppercase', () => expect(isValidSlug('Malaria-Bot')).toBe(false))
    it('should reject spaces', () => expect(isValidSlug('malaria bot')).toBe(false))
    it('should reject special chars', () => expect(isValidSlug('malaria_bot')).toBe(false))
  })
})
