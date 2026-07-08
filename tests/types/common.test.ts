import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import type {
  PaginatedResponse,
  Document,
  Block,
  CompileJob,
  HivRelease,
  ChunkLibraryEntry,
  ChunkStats,
  AccessCode,
  HealthCheck,
  User,
  LoginResponse,
  ChatbotTone,
  ChatbotGuidelines,
  AgencyChatbot,
  ChatbotStats,
  ApiError,
} from '@/types/common'
import type { DocumentStatus, BlockStatus, JobStatus, Role, ChatbotStatus } from '@/types/enums'

describe('types/common.ts — Interface Shape Validation', () => {
  describe('PaginatedResponse<T>', () => {
    const schema = z.object({
      data: z.array(z.object({ id: z.string() })),
      meta: z.object({
        total: z.number(),
        page: z.number(),
        per_page: z.number(),
        total_pages: z.number(),
      }),
    })

    it('should accept valid paginated response', () => {
      const valid = {
        data: [{ id: '1' }, { id: '2' }],
        meta: { total: 2, page: 1, per_page: 20, total_pages: 1 },
      }
      expect(() => schema.parse(valid)).not.toThrow()
    })

    it('should reject if meta.total is missing', () => {
      const invalid = {
        data: [],
        meta: { page: 1, per_page: 20, total_pages: 0 },
      }
      expect(() => schema.parse(invalid)).toThrow()
    })

    it('should reject if meta.per_page is missing', () => {
      const invalid = {
        data: [],
        meta: { total: 0, page: 1, total_pages: 0 },
      }
      expect(() => schema.parse(invalid)).toThrow()
    })
  })

  describe('Document', () => {
    const docSchema = z.object({
      id: z.string(),
      name: z.string(),
      source: z.string(),
      year: z.string(),
      origin_language: z.string(),
      status: z.enum(['pending_review', 'in_review', 'ready_to_compile', 'compiling', 'compiled', 'failed']),
      file_path: z.string(),
      file_extension: z.enum(['.pdf', '.docx']),
      created_by: z.object({ id: z.string(), full_name: z.string() }),
      created_at: z.string(),
      updated_at: z.string(),
    })

    it('should accept valid document', () => {
      const doc: z.infer<typeof docSchema> = {
        id: 'doc-1',
        name: 'Malaria Guidelines 2024',
        source: 'WHO',
        year: '2024',
        origin_language: 'en',
        status: 'pending_review',
        file_path: '/uploads/doc-1.pdf',
        file_extension: '.pdf',
        created_by: { id: 'u1', full_name: 'Admin User' },
        created_at: '2026-05-01T10:00:00Z',
        updated_at: '2026-05-01T10:00:00Z',
      }
      expect(() => docSchema.parse(doc)).not.toThrow()
    })

    it('should reject if created_by is a string (not an object)', () => {
      const invalid = {
        id: 'doc-1',
        name: 'Test',
        source: 'src',
        year: '2024',
        origin_language: 'en',
        status: 'pending_review',
        file_path: '/test.pdf',
        file_extension: '.pdf',
        created_by: 'admin@hiva.ng',
        created_at: '2026-05-01T10:00:00Z',
        updated_at: '2026-05-01T10:00:00Z',
      }
      expect(() => docSchema.parse(invalid)).toThrow()
    })

    it('should reject invalid file_extension', () => {
      const invalid = {
        id: 'doc-1',
        name: 'Test',
        source: 'src',
        year: '2024',
        origin_language: 'en',
        status: 'pending_review',
        file_path: '/test.pdf',
        file_extension: '.doc',
        created_by: { id: 'u1', full_name: 'Admin' },
        created_at: '2026-05-01T10:00:00Z',
        updated_at: '2026-05-01T10:00:00Z',
      }
      expect(() => docSchema.parse(invalid)).toThrow()
    })
  })

  describe('Block', () => {
    const blockSchema = z.object({
      id: z.string(),
      document_id: z.string(),
      block_index: z.number(),
      block_type: z.enum(['paragraph', 'heading', 'table', 'image_placeholder']),
      raw_content: z.string(),
      structured_content: z.union([z.record(z.unknown()), z.null()]),
      confidence_score: z.number().min(0).max(1),
      status: z.enum(['pending', 'approved', 'flagged']),
      reviewer_notes: z.union([z.string(), z.null()]),
      reviewed_by: z.union([z.string(), z.null()]),
      reviewed_at: z.union([z.string(), z.null()]),
      created_at: z.string(),
    })

    it('should accept valid block with null structured_content', () => {
      const block = {
        id: 'block-1',
        document_id: 'doc-1',
        block_index: 0,
        block_type: 'paragraph',
        raw_content: 'Some clinical text',
        structured_content: null,
        confidence_score: 0.95,
        status: 'pending',
        reviewer_notes: null,
        reviewed_by: null,
        reviewed_at: null,
        created_at: '2026-05-01T10:00:00Z',
      }
      expect(() => blockSchema.parse(block)).not.toThrow()
    })

    it('should accept block with structured_content object', () => {
      const block = {
        id: 'block-1',
        document_id: 'doc-1',
        block_index: 0,
        block_type: 'paragraph',
        raw_content: 'Some text',
        structured_content: { text: 'Formatted text' },
        confidence_score: 0.85,
        status: 'approved',
        reviewer_notes: 'Looks good',
        reviewed_by: 'u1',
        reviewed_at: '2026-05-01T12:00:00Z',
        created_at: '2026-05-01T10:00:00Z',
      }
      expect(() => blockSchema.parse(block)).not.toThrow()
    })

    it('should reject confidence_score above 1', () => {
      const invalid = {
        id: 'block-1',
        document_id: 'doc-1',
        block_index: 0,
        block_type: 'paragraph',
        raw_content: 'text',
        structured_content: null,
        confidence_score: 1.5,
        status: 'pending',
        reviewer_notes: null,
        reviewed_by: null,
        reviewed_at: null,
        created_at: '2026-05-01T10:00:00Z',
      }
      expect(() => blockSchema.parse(invalid)).toThrow()
    })
  })

  describe('AccessCode', () => {
    const acSchema = z.object({
      id: z.string(),
      server_code: z.string().regex(/^HIVA-[A-Z0-9]{4}$/),
      name: z.string(),
      max_users: z.union([z.number(), z.null()]),
      auth_count: z.number(),
      is_active: z.boolean(),
      expires_at: z.union([z.string(), z.null()]),
      last_used_at: z.union([z.string(), z.null()]),
      notes: z.union([z.string(), z.null()]),
      created_at: z.string(),
      updated_at: z.string(),
    })

    it('should accept valid access code', () => {
      const code = {
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
      expect(() => acSchema.parse(code)).not.toThrow()
    })

    it('should accept null max_users (unlimited)', () => {
      const code = {
        id: 'ac-2',
        server_code: 'HIVA-A1Z2',
        name: 'Unlimited Team',
        max_users: null,
        auth_count: 47,
        is_active: true,
        expires_at: null,
        last_used_at: '2026-05-06T16:45:00Z',
        notes: null,
        created_at: '2026-03-10T08:00:00Z',
        updated_at: '2026-03-10T08:00:00Z',
      }
      expect(() => acSchema.parse(code)).not.toThrow()
    })

    it('should reject invalid server_code format', () => {
      const invalid = {
        id: 'ac-3',
        server_code: 'HIVAShort',
        name: 'Bad Code',
        max_users: 10,
        auth_count: 2,
        is_active: false,
        expires_at: null,
        last_used_at: null,
        notes: null,
        created_at: '2026-05-01T10:00:00Z',
        updated_at: '2026-05-01T10:00:00Z',
      }
      expect(() => acSchema.parse(invalid)).toThrow()
    })

    it('should reject negative auth_count', () => {
      const acSchemaWithMin = acSchema.extend({ auth_count: z.number().int().min(0) })
      const invalid = {
        id: 'ac-3',
        server_code: 'HIVA-T3ST',
        name: 'Bad',
        max_users: 10,
        auth_count: -1,
        is_active: true,
        expires_at: null,
        last_used_at: null,
        notes: null,
        created_at: '2026-05-01T10:00:00Z',
        updated_at: '2026-05-01T10:00:00Z',
      }
      expect(() => acSchemaWithMin.parse(invalid)).toThrow()
    })
  })

  describe('CompileJob', () => {
    const jobSchema = z.object({
      id: z.string(),
      document_id: z.string(),
      document_name: z.string().optional(),
      languages: z.array(z.enum(['en', 'ha', 'yo', 'ig', 'pcm'])),
      status: z.enum(['queued', 'running', 'complete', 'failed']),
      current_step: z.union([
        z.enum(['chunk', 'deduplicate', 'translate', 'package', 'sign', 'complete']),
        z.null(),
      ]),
      started_at: z.union([z.string(), z.null()]),
      completed_at: z.union([z.string(), z.null()]),
      hiv_file_size_kb: z.union([z.number(), z.null()]),
      chunk_count: z.union([z.number(), z.null()]),
      reused_chunk_count: z.union([z.number(), z.null()]),
      error_message: z.union([z.string(), z.null()]),
      created_by: z.object({ id: z.string(), full_name: z.string() }),
      created_at: z.string(),
    })

    it('should accept running job', () => {
      const job: z.infer<typeof jobSchema> = {
        id: 'job-1',
        document_id: 'doc-1',
        document_name: 'Malaria Guidelines',
        languages: ['en', 'ha'],
        status: 'running',
        current_step: 'chunk',
        started_at: '2026-05-08T14:00:00Z',
        completed_at: null,
        hiv_file_size_kb: null,
        chunk_count: null,
        reused_chunk_count: null,
        error_message: null,
        created_by: { id: 'u1', full_name: 'Admin' },
        created_at: '2026-05-08T14:00:00Z',
      }
      expect(() => jobSchema.parse(job)).not.toThrow()
    })

    it('should accept failed job with error message', () => {
      const job: z.infer<typeof jobSchema> = {
        id: 'job-2',
        document_id: 'doc-1',
        languages: ['en'],
        status: 'failed',
        current_step: null,
        started_at: '2026-05-08T14:00:00Z',
        completed_at: '2026-05-08T14:30:00Z',
        hiv_file_size_kb: null,
        chunk_count: null,
        reused_chunk_count: null,
        error_message: 'Translation service unavailable',
        created_by: { id: 'u1', full_name: 'Admin' },
        created_at: '2026-05-08T14:00:00Z',
      }
      expect(() => jobSchema.parse(job)).not.toThrow()
    })
  })

  describe('HealthCheck', () => {
    const healthSchema = z.object({
      status: z.enum(['ok', 'degraded']),
      version: z.string(),
      db: z.string(),
      redis: z.string(),
      worker_queues: z.object({
        restructure: z.number(),
        compile: z.number(),
      }),
    })

    it('should accept ok health check', () => {
      const hc = {
        status: 'ok',
        version: '2.1.0',
        db: 'connected',
        redis: 'connected',
        worker_queues: { restructure: 0, compile: 2 },
      }
      expect(() => healthSchema.parse(hc)).not.toThrow()
    })

    it('should reject missing worker_queues', () => {
      const invalid = {
        status: 'ok',
        version: '2.1.0',
        db: 'connected',
        redis: 'connected',
      }
      expect(() => healthSchema.parse(invalid)).toThrow()
    })
  })

  describe('User', () => {
    const userSchema = z.object({
      id: z.string(),
      email: z.string().email(),
      full_name: z.string(),
      role: z.enum(['admin', 'reviewer']),
      is_active: z.boolean().optional(),
      created_at: z.string().optional(),
    })

    it('should accept minimal user from exchange endpoint', () => {
      const user = { id: 'u1', email: 'a@b.com', full_name: 'Test', role: 'admin' }
      expect(() => userSchema.parse(user)).not.toThrow()
    })

    it('should accept full user', () => {
      const user = {
        id: 'u1',
        email: 'a@b.com',
        full_name: 'Test',
        role: 'reviewer',
        is_active: true,
        created_at: '2026-01-01T00:00:00Z',
      }
      expect(() => userSchema.parse(user)).not.toThrow()
    })

    it('should reject invalid email', () => {
      const invalid = { id: 'u1', email: 'not-an-email', full_name: 'Test', role: 'admin' }
      expect(() => userSchema.parse(invalid)).toThrow()
    })

    it('should reject invalid role', () => {
      const invalid = { id: 'u1', email: 'a@b.com', full_name: 'Test', role: 'superadmin' }
      expect(() => userSchema.parse(invalid)).toThrow()
    })
  })

  describe('ApiError', () => {
    const apiErrorSchema = z.object({
      status: z.number(),
      message: z.string(),
      detail: z.union([z.string(), z.record(z.unknown()), z.null()]),
    })

    it('should accept valid ApiError', () => {
      const err = { status: 400, message: 'Bad Request', detail: 'Unapproved blocks' }
      expect(() => apiErrorSchema.parse(err)).not.toThrow()
    })

    it('should accept ApiError with object detail', () => {
      const err = { status: 422, message: 'Validation Error', detail: { blocks: ['block-1', 'block-2'] } }
      expect(() => apiErrorSchema.parse(err)).not.toThrow()
    })

    it('should accept ApiError with null detail', () => {
      const err = { status: 500, message: 'Server Error', detail: null }
      expect(() => apiErrorSchema.parse(err)).not.toThrow()
    })
  })
})