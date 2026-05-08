/**
 * PHASE 2 — Functional Testing: Document & Job Service Layer
 *
 * Covers: CRUD operations, file upload, compile, error paths, pagination,
 * status filtering, and correct API path routing.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

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

const TOKEN = 'test-compiler-token'

function stubTokenPresent() {
  vi.stubGlobal('sessionStorage', {
    getItem: vi.fn().mockReturnValue(TOKEN),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  })
}

function stubTokenAbsent() {
  vi.stubGlobal('sessionStorage', {
    getItem: vi.fn().mockReturnValue(null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  })
}

const docFixture = {
  id: 'doc-abc',
  name: 'Malaria Guidelines 2024',
  source: 'WHO',
  year: '2024',
  origin_language: 'English',
  status: 'pending_review',
  file_path: '/uploads/doc-abc.pdf',
  file_extension: '.pdf',
  created_by: { id: 'u1', full_name: 'Admin User' },
  created_at: '2026-05-01T10:00:00Z',
  updated_at: '2026-05-01T10:00:00Z',
}

const jobFixture = {
  id: 'job-xyz',
  document_id: 'doc-abc',
  document_name: 'Malaria Guidelines 2024',
  languages: ['en', 'ha'],
  status: 'queued',
  current_step: null,
  started_at: null,
  completed_at: null,
  hiv_file_size_kb: null,
  chunk_count: null,
  reused_chunk_count: null,
  validation_warnings: null,
  error_message: null,
  created_by: { id: 'u1', full_name: 'Admin User' },
  created_at: '2026-05-01T11:00:00Z',
}

describe('services/documents.service.ts', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    vi.resetModules()
    vi.stubGlobal('fetch', mockFetch)
    stubTokenPresent()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('list()', () => {
    it('should GET /documents with no params', async () => {
      const paged = { data: [docFixture], meta: { total: 1, page: 1, per_page: 20, total_pages: 1 } }
      mockFetch.mockResolvedValueOnce(makeOk(paged))
      const { documentsService } = await import('@/services/documents.service')
      const result = await documentsService.list()
      const [[url]] = mockFetch.mock.calls
      expect(url).toContain('/api/documents')
      expect(result.data[0].id).toBe('doc-abc')
    })

    it('should pass status filter as query param', async () => {
      mockFetch.mockResolvedValueOnce(makeOk({ data: [], meta: { total: 0, page: 1, per_page: 20, total_pages: 0 } }))
      const { documentsService } = await import('@/services/documents.service')
      await documentsService.list({ status: 'ready_to_compile', page: 1, per_page: 20 })
      const [[url]] = mockFetch.mock.calls
      expect(url).toContain('status=ready_to_compile')
      expect(url).toContain('page=1')
    })

    it('should return empty data array when no documents exist', async () => {
      mockFetch.mockResolvedValueOnce(makeOk({ data: [], meta: { total: 0, page: 1, per_page: 20, total_pages: 0 } }))
      const { documentsService } = await import('@/services/documents.service')
      const result = await documentsService.list()
      expect(result.data).toHaveLength(0)
      expect(result.meta.total).toBe(0)
    })

    it('should throw ApiError when not authenticated', async () => {
      stubTokenAbsent()
      mockFetch.mockResolvedValueOnce(makeErr(401, 'Unauthorized'))
      const { documentsService } = await import('@/services/documents.service')
      await expect(documentsService.list()).rejects.toMatchObject({ status: 401 })
    })
  })

  describe('get()', () => {
    it('should GET /documents/:id and unwrap envelope', async () => {
      mockFetch.mockResolvedValueOnce(makeOk({ data: docFixture }))
      const { documentsService } = await import('@/services/documents.service')
      const doc = await documentsService.get('doc-abc')
      const [[url]] = mockFetch.mock.calls
      expect(url).toContain('/api/documents/doc-abc')
      expect(doc.id).toBe('doc-abc')
    })

    it('should throw 404 ApiError for non-existent document', async () => {
      mockFetch.mockResolvedValueOnce(makeErr(404, 'Document not found'))
      const { documentsService } = await import('@/services/documents.service')
      await expect(documentsService.get('nonexistent-id')).rejects.toMatchObject({
        status: 404,
        detail: 'Document not found',
      })
    })
  })

  describe('upload()', () => {
    it('should POST multipart to /documents/upload', async () => {
      mockFetch.mockResolvedValueOnce(makeOk({ data: docFixture }))
      const { documentsService } = await import('@/services/documents.service')
      const fd = new FormData()
      fd.append('file', new Blob(['pdf-content'], { type: 'application/pdf' }), 'test.pdf')
      fd.append('name', 'Test Doc')
      fd.append('source', 'WHO')
      fd.append('year', '2024')
      const result = await documentsService.upload(fd)
      const [[url, opts]] = mockFetch.mock.calls
      expect(url).toContain('/api/documents/upload')
      expect(opts.method).toBe('POST')
      expect(result.id).toBe('doc-abc')
    })

    it('should throw 413 on oversized file (backend response)', async () => {
      mockFetch.mockResolvedValueOnce(makeErr(413, 'File too large'))
      const { documentsService } = await import('@/services/documents.service')
      const fd = new FormData()
      await expect(documentsService.upload(fd)).rejects.toMatchObject({ status: 413 })
    })

    it('should throw 415 on unsupported file type (backend response)', async () => {
      mockFetch.mockResolvedValueOnce(makeErr(415, 'Unsupported Media Type'))
      const { documentsService } = await import('@/services/documents.service')
      const fd = new FormData()
      await expect(documentsService.upload(fd)).rejects.toMatchObject({ status: 415 })
    })
  })

  describe('markReady()', () => {
    it('should POST to /documents/:id/ready', async () => {
      const readyDoc = { ...docFixture, status: 'ready_to_compile' }
      mockFetch.mockResolvedValueOnce(makeOk({ data: readyDoc }))
      const { documentsService } = await import('@/services/documents.service')
      const result = await documentsService.markReady('doc-abc')
      const [[url, opts]] = mockFetch.mock.calls
      expect(url).toContain('/api/documents/doc-abc/ready')
      expect(opts.method).toBe('POST')
      expect(result.status).toBe('ready_to_compile')
    })

    it('should throw 400 when blocks are not all approved', async () => {
      mockFetch.mockResolvedValueOnce(makeErr(400, { blocks: ['block-1', 'block-2'] }))
      const { documentsService } = await import('@/services/documents.service')
      await expect(documentsService.markReady('doc-abc')).rejects.toMatchObject({ status: 400 })
    })
  })

  describe('delete()', () => {
    it('should DELETE /documents/:id and return undefined for 204', async () => {
      mockFetch.mockResolvedValueOnce(makeOk204())
      const { documentsService } = await import('@/services/documents.service')
      const result = await documentsService.delete('doc-abc')
      const [[url, opts]] = mockFetch.mock.calls
      expect(url).toContain('/api/documents/doc-abc')
      expect(opts.method).toBe('DELETE')
      expect(result).toBeUndefined()
    })

    it('should throw 403 when reviewer tries to delete', async () => {
      mockFetch.mockResolvedValueOnce(makeErr(403, 'Forbidden'))
      const { documentsService } = await import('@/services/documents.service')
      await expect(documentsService.delete('doc-abc')).rejects.toMatchObject({ status: 403 })
    })
  })

  describe('compile()', () => {
    it('should POST to /documents/:id/compile with languages', async () => {
      mockFetch.mockResolvedValueOnce(makeOk({ data: jobFixture }))
      const { documentsService } = await import('@/services/documents.service')
      const job = await documentsService.compile('doc-abc', { languages: ['en', 'ha'] })
      const [[url, opts]] = mockFetch.mock.calls
      expect(url).toContain('/api/documents/doc-abc/compile')
      expect(opts.method).toBe('POST')
      expect(JSON.parse(opts.body)).toMatchObject({ languages: ['en', 'ha'] })
      expect(job.id).toBe('job-xyz')
    })

    it('should require at least english in languages', async () => {
      mockFetch.mockResolvedValueOnce(makeOk({ data: jobFixture }))
      const { documentsService } = await import('@/services/documents.service')
      await documentsService.compile('doc-abc', { languages: ['en'] })
      const [[, opts]] = mockFetch.mock.calls
      expect(JSON.parse(opts.body).languages).toContain('en')
    })

    it('should throw 409 when document is already compiling', async () => {
      mockFetch.mockResolvedValueOnce(makeErr(409, 'Document already in compilation'))
      const { documentsService } = await import('@/services/documents.service')
      await expect(documentsService.compile('doc-abc', { languages: ['en'] })).rejects.toMatchObject({
        status: 409,
      })
    })
  })
})

describe('services/jobs.service.ts', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    vi.resetModules()
    vi.stubGlobal('fetch', mockFetch)
    stubTokenPresent()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('list()', () => {
    it('should GET /jobs with pagination params', async () => {
      const paged = { data: [jobFixture], meta: { total: 1, page: 1, per_page: 5, total_pages: 1 } }
      mockFetch.mockResolvedValueOnce(makeOk(paged))
      const { jobsService } = await import('@/services/jobs.service')
      const result = await jobsService.list({ page: 1, per_page: 5 })
      const [[url]] = mockFetch.mock.calls
      expect(url).toContain('/api/jobs')
      expect(url).toContain('page=1')
      expect(result.data[0].status).toBe('queued')
    })

    it('should filter by document_id', async () => {
      mockFetch.mockResolvedValueOnce(makeOk({ data: [jobFixture], meta: { total: 1, page: 1, per_page: 20, total_pages: 1 } }))
      const { jobsService } = await import('@/services/jobs.service')
      await jobsService.list({ document_id: 'doc-abc' })
      const [[url]] = mockFetch.mock.calls
      expect(url).toContain('document_id=doc-abc')
    })
  })

  describe('get()', () => {
    it('should GET /jobs/:id', async () => {
      mockFetch.mockResolvedValueOnce(makeOk({ data: jobFixture }))
      const { jobsService } = await import('@/services/jobs.service')
      const job = await jobsService.get('job-xyz')
      const [[url]] = mockFetch.mock.calls
      expect(url).toContain('/api/jobs/job-xyz')
      expect(job.id).toBe('job-xyz')
    })
  })

  describe('download()', () => {
    it('should GET /jobs/:id/download as blob', async () => {
      const blob = new Blob(['binary-data'], { type: 'application/octet-stream' })
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200, blob: () => Promise.resolve(blob) })
      const { jobsService } = await import('@/services/jobs.service')
      const result = await jobsService.download('job-xyz')
      const [[url, opts]] = mockFetch.mock.calls
      expect(url).toContain('/api/jobs/job-xyz/download')
      expect(opts.method).toBe('GET')
      expect(result).toBeInstanceOf(Blob)
    })

    it('should throw 403 if reviewer tries to download', async () => {
      mockFetch.mockResolvedValueOnce(makeErr(403, 'Forbidden'))
      const { jobsService } = await import('@/services/jobs.service')
      await expect(jobsService.download('job-xyz')).rejects.toMatchObject({ status: 403 })
    })
  })

  describe('retry()', () => {
    it('should POST to /jobs/:id/retry', async () => {
      mockFetch.mockResolvedValueOnce(makeOk({ data: { ...jobFixture, status: 'queued' } }))
      const { jobsService } = await import('@/services/jobs.service')
      const job = await jobsService.retry('job-xyz')
      const [[url, opts]] = mockFetch.mock.calls
      expect(url).toContain('/api/jobs/job-xyz/retry')
      expect(opts.method).toBe('POST')
    })
  })
})

describe('services/releases.service.ts', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    vi.resetModules()
    vi.stubGlobal('fetch', mockFetch)
    stubTokenPresent()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const releaseFixture = {
    id: 'rel-1',
    version: '2.1.0',
    sha256: 'a3f7e2d9abc',
    size_kb: 4820,
    chunk_count: 312,
    languages: ['en', 'ha', 'yo'],
    is_active: false,
    needs_review: true,
    created_at: '2026-05-01T12:00:00Z',
  }

  it('should GET /releases with pagination', async () => {
    mockFetch.mockResolvedValueOnce(makeOk({ data: [releaseFixture], meta: { total: 1, page: 1, per_page: 20, total_pages: 1 } }))
    const { releasesService } = await import('@/services/releases.service')
    const result = await releasesService.list({ page: 1 })
    expect(result.data[0].version).toBe('2.1.0')
  })

  it('should POST /releases/:id/activate', async () => {
    mockFetch.mockResolvedValueOnce(makeOk({ data: { ...releaseFixture, is_active: true } }))
    const { releasesService } = await import('@/services/releases.service')
    const result = await releasesService.activate('rel-1')
    const [[url, opts]] = mockFetch.mock.calls
    expect(url).toContain('/api/releases/rel-1/activate')
    expect(opts.method).toBe('POST')
    expect(result.is_active).toBe(true)
  })
})
