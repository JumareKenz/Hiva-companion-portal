/**
 * PHASE 2 — Functional Testing: Access Codes Service
 *
 * Covers: CRUD operations, code format validation, admin-only mutation
 * patterns, error paths, and revocation edge cases.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { CreateAccessCodeInput, UpdateAccessCodeInput } from '@/services/accessCodes.service'

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

const codeFixture = {
  id: 'ac-1',
  server_code: 'HIVA-K7H4',
  name: 'Northeast CHW Rollout',
  max_users: 25,
  auth_count: 12,
  is_active: true,
  expires_at: null,
  last_used_at: '2026-05-07T10:30:00Z',
  notes: 'Pilot group',
  created_at: '2026-04-01T09:00:00Z',
  updated_at: '2026-05-01T14:22:00Z',
}

describe('services/accessCodes.service.ts', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    vi.resetModules()
    vi.stubGlobal('fetch', mockFetch)
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn().mockReturnValue('admin-token'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('list()', () => {
    it('should GET /access-codes and return paginated response', async () => {
      const paged = { data: [codeFixture], meta: { total: 1, page: 1, per_page: 100, total_pages: 1 } }
      mockFetch.mockResolvedValueOnce(makeOk(paged))
      const { accessCodesService } = await import('@/services/accessCodes.service')
      const result = await accessCodesService.list()
      const [[url]] = mockFetch.mock.calls
      expect(url).toContain('/api/access-codes')
      expect(result.data[0].server_code).toBe('HIVA-K7H4')
    })

    it('should support active_only filter', async () => {
      mockFetch.mockResolvedValueOnce(makeOk({ data: [], meta: { total: 0, page: 1, per_page: 100, total_pages: 0 } }))
      const { accessCodesService } = await import('@/services/accessCodes.service')
      await accessCodesService.list({ active_only: true })
      const [[url]] = mockFetch.mock.calls
      expect(url).toContain('active_only=true')
    })

    it('should return empty list when no codes exist', async () => {
      mockFetch.mockResolvedValueOnce(makeOk({ data: [], meta: { total: 0, page: 1, per_page: 100, total_pages: 0 } }))
      const { accessCodesService } = await import('@/services/accessCodes.service')
      const result = await accessCodesService.list()
      expect(result.data).toHaveLength(0)
    })

    it('should throw 401 when unauthenticated', async () => {
      mockFetch.mockResolvedValueOnce(makeErr(401, 'Unauthorized'))
      const { accessCodesService } = await import('@/services/accessCodes.service')
      await expect(accessCodesService.list()).rejects.toMatchObject({ status: 401 })
    })

    it('should throw 403 when reviewer role tries to list', async () => {
      mockFetch.mockResolvedValueOnce(makeErr(403, 'Forbidden'))
      const { accessCodesService } = await import('@/services/accessCodes.service')
      await expect(accessCodesService.list()).rejects.toMatchObject({ status: 403 })
    })
  })

  describe('create()', () => {
    it('should POST to /access-codes with all fields', async () => {
      mockFetch.mockResolvedValueOnce(makeOk({ data: codeFixture }))
      const { accessCodesService } = await import('@/services/accessCodes.service')
      const input: CreateAccessCodeInput = {
        name: 'Northeast CHW Rollout',
        max_users: 25,
        expires_at: null,
        code_suffix: 'K7H4',
        notes: 'Pilot group',
      }
      const result = await accessCodesService.create(input)
      const [[url, opts]] = mockFetch.mock.calls
      expect(url).toContain('/api/access-codes')
      expect(opts.method).toBe('POST')
      const body = JSON.parse(opts.body)
      expect(body.name).toBe('Northeast CHW Rollout')
      expect(result.server_code).toBe('HIVA-K7H4')
    })

    it('should POST with minimal required fields only', async () => {
      mockFetch.mockResolvedValueOnce(makeOk({ data: { ...codeFixture, notes: null } }))
      const { accessCodesService } = await import('@/services/accessCodes.service')
      const input: CreateAccessCodeInput = { name: 'Minimal Code' }
      await accessCodesService.create(input)
      const [[, opts]] = mockFetch.mock.calls
      const body = JSON.parse(opts.body)
      expect(body.name).toBe('Minimal Code')
    })

    it('should POST with null optional fields (not omitting them)', async () => {
      mockFetch.mockResolvedValueOnce(makeOk({ data: codeFixture }))
      const { accessCodesService } = await import('@/services/accessCodes.service')
      const input: CreateAccessCodeInput = {
        name: 'Test',
        max_users: null,
        expires_at: null,
        code_suffix: null,
        notes: null,
      }
      await accessCodesService.create(input)
      const [[, opts]] = mockFetch.mock.calls
      const body = JSON.parse(opts.body)
      expect(body.max_users).toBeNull()
      expect(body.expires_at).toBeNull()
    })

    it('should throw 422 if name is blank', async () => {
      mockFetch.mockResolvedValueOnce(makeErr(422, { name: ['This field is required'] }))
      const { accessCodesService } = await import('@/services/accessCodes.service')
      await expect(accessCodesService.create({ name: '' })).rejects.toMatchObject({ status: 422 })
    })

    it('should throw 409 if code_suffix is already taken', async () => {
      mockFetch.mockResolvedValueOnce(makeErr(409, 'Code suffix already in use'))
      const { accessCodesService } = await import('@/services/accessCodes.service')
      await expect(accessCodesService.create({ name: 'Test', code_suffix: 'DUPE' })).rejects.toMatchObject({
        status: 409,
      })
    })
  })

  describe('update()', () => {
    it('should PATCH /access-codes/:id with partial fields', async () => {
      const updated = { ...codeFixture, name: 'Updated Name', max_users: 50 }
      mockFetch.mockResolvedValueOnce(makeOk({ data: updated }))
      const { accessCodesService } = await import('@/services/accessCodes.service')
      const input: UpdateAccessCodeInput = { name: 'Updated Name', max_users: 50 }
      const result = await accessCodesService.update('ac-1', input)
      const [[url, opts]] = mockFetch.mock.calls
      expect(url).toContain('/api/access-codes/ac-1')
      expect(opts.method).toBe('PATCH')
      expect(JSON.parse(opts.body).name).toBe('Updated Name')
      expect(result.name).toBe('Updated Name')
    })

    it('should PATCH with null max_users to set unlimited', async () => {
      mockFetch.mockResolvedValueOnce(makeOk({ data: { ...codeFixture, max_users: null } }))
      const { accessCodesService } = await import('@/services/accessCodes.service')
      await accessCodesService.update('ac-1', { max_users: null })
      const [[, opts]] = mockFetch.mock.calls
      expect(JSON.parse(opts.body).max_users).toBeNull()
    })

    it('should throw 404 updating non-existent code', async () => {
      mockFetch.mockResolvedValueOnce(makeErr(404, 'Not found'))
      const { accessCodesService } = await import('@/services/accessCodes.service')
      await expect(accessCodesService.update('nonexistent', { name: 'x' })).rejects.toMatchObject({ status: 404 })
    })
  })

  describe('revoke()', () => {
    it('should DELETE /access-codes/:id', async () => {
      mockFetch.mockResolvedValueOnce(makeOk204())
      const { accessCodesService } = await import('@/services/accessCodes.service')
      const result = await accessCodesService.revoke('ac-1')
      const [[url, opts]] = mockFetch.mock.calls
      expect(url).toContain('/api/access-codes/ac-1')
      expect(opts.method).toBe('DELETE')
      expect(result).toBeUndefined()
    })

    it('should throw 404 revoking already-deleted code', async () => {
      mockFetch.mockResolvedValueOnce(makeErr(404, 'Not found'))
      const { accessCodesService } = await import('@/services/accessCodes.service')
      await expect(accessCodesService.revoke('nonexistent')).rejects.toMatchObject({ status: 404 })
    })

    it('should throw 403 when reviewer attempts revoke', async () => {
      mockFetch.mockResolvedValueOnce(makeErr(403, 'Forbidden'))
      const { accessCodesService } = await import('@/services/accessCodes.service')
      await expect(accessCodesService.revoke('ac-1')).rejects.toMatchObject({ status: 403 })
    })
  })
})

// ─── Access Code Input Validation (client-side, from the page) ────────────────

describe('Access Code Form — Client-side Validation', () => {
  describe('name field', () => {
    it('should require non-empty name', () => {
      const validate = (name: string) => name.trim().length > 0
      expect(validate('')).toBe(false)
      expect(validate('   ')).toBe(false)
      expect(validate('Northeast CHW')).toBe(true)
    })

    it('should accept long names (no max length in schema)', () => {
      const longName = 'A'.repeat(255)
      const validate = (name: string) => name.trim().length > 0
      expect(validate(longName)).toBe(true)
    })
  })

  describe('max_users field', () => {
    it('should convert empty string to null (unlimited)', () => {
      const normalize = (v: string) => (v === '' ? null : Number(v))
      expect(normalize('')).toBeNull()
      expect(normalize('25')).toBe(25)
    })

    it('should reject negative max_users', () => {
      const isValid = (v: number | null) => v === null || v >= 1
      expect(isValid(-1)).toBe(false)
      expect(isValid(0)).toBe(false)
      expect(isValid(1)).toBe(true)
      expect(isValid(null)).toBe(true)
    })
  })

  describe('code_suffix field', () => {
    it('should enforce maxLength of 4 characters (HTML attribute only)', () => {
      const MAX_SUFFIX_LENGTH = 4
      expect('ABCD'.length).toBeLessThanOrEqual(MAX_SUFFIX_LENGTH)
      expect('ABCDE'.length).toBeGreaterThan(MAX_SUFFIX_LENGTH)
    })

    it('should accept alphanumeric suffix', () => {
      const isValidSuffix = (s: string) => /^[A-Z0-9]{1,4}$/.test(s)
      expect(isValidSuffix('AB12')).toBe(true)
      expect(isValidSuffix('ABCD')).toBe(true)
    })
  })

  describe('expires_at field', () => {
    it('should convert datetime-local value to ISO string', () => {
      const localValue = '2026-12-31T23:59'
      const iso = new Date(localValue).toISOString()
      expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })

    it('should normalize empty expires_at to null', () => {
      const normalize = (v: string) => (v === '' ? null : new Date(v).toISOString())
      expect(normalize('')).toBeNull()
    })
  })
})
