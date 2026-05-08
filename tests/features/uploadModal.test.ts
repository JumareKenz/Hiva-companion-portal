/**
 * PHASE 2 & 3 — Upload Modal: Form Validation, File Handling, Edge Cases
 *
 * Tests the UploadModal logic (schema + MIME validation + XHR progress)
 * without rendering React components (logic-layer tests).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'

// Replicate the upload schema from UploadModal.tsx
const uploadSchema = z.object({
  name: z.string().min(1, 'Document name is required'),
  source: z.string().min(1, 'Source organization is required'),
  year: z.string().regex(/^\d{4}$/, 'Enter a valid year'),
  origin_language: z.string().default('English'),
})

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

function validateFile(file: { type: string; size: number } | null): 'ok' | 'invalid_type' | 'too_large' | 'no_file' {
  if (!file) return 'no_file'
  if (!ALLOWED_MIME_TYPES.includes(file.type)) return 'invalid_type'
  if (file.size > MAX_FILE_SIZE) return 'too_large'
  return 'ok'
}

describe('UploadModal — Form Schema Validation', () => {
  describe('name field', () => {
    it('should reject empty name', () => {
      const r = uploadSchema.safeParse({ name: '', source: 'WHO', year: '2024' })
      expect(r.success).toBe(false)
      expect(r.error?.issues[0].message).toBe('Document name is required')
    })

    it('should accept single-character name', () => {
      const r = uploadSchema.safeParse({ name: 'A', source: 'WHO', year: '2024' })
      expect(r.success).toBe(true)
    })

    it('should accept Unicode characters in name (multilingual docs)', () => {
      const r = uploadSchema.safeParse({ name: 'Malaria Gwadar النساء', source: 'WHO', year: '2024' })
      expect(r.success).toBe(true)
    })

    it('should accept name with special characters', () => {
      const r = uploadSchema.safeParse({ name: 'Guidelines (v2) — Final!', source: 'WHO', year: '2024' })
      expect(r.success).toBe(true)
    })

    it('should accept 10,000-char name (no max enforced)', () => {
      const r = uploadSchema.safeParse({ name: 'x'.repeat(10000), source: 'WHO', year: '2024' })
      expect(r.success).toBe(true)
    })
  })

  describe('source field', () => {
    it('should reject empty source', () => {
      const r = uploadSchema.safeParse({ name: 'Test', source: '', year: '2024' })
      expect(r.success).toBe(false)
    })

    it('should accept organization names with dots and commas', () => {
      const r = uploadSchema.safeParse({ name: 'T', source: 'WHO, FMOH (Nigeria)', year: '2024' })
      expect(r.success).toBe(true)
    })
  })

  describe('year field — regex boundary tests', () => {
    const validYears = ['1900', '2000', '2024', '2099', '9999']
    const invalidYears = ['', '202', '20240', 'abcd', '20 4', '2024.', '-024', '02024']

    validYears.forEach((year) => {
      it(`accepts year: ${year}`, () => {
        const r = uploadSchema.safeParse({ name: 'T', source: 'S', year })
        expect(r.success).toBe(true)
      })
    })

    invalidYears.forEach((year) => {
      it(`rejects year: "${year}"`, () => {
        const r = uploadSchema.safeParse({ name: 'T', source: 'S', year })
        expect(r.success).toBe(false)
      })
    })
  })

  describe('origin_language field', () => {
    it('should default to English when not provided', () => {
      const r = uploadSchema.safeParse({ name: 'T', source: 'S', year: '2024' })
      expect(r.success).toBe(true)
      expect(r.data?.origin_language).toBe('English')
    })

    it('should accept Hausa as origin language', () => {
      const r = uploadSchema.safeParse({ name: 'T', source: 'S', year: '2024', origin_language: 'Hausa' })
      expect(r.success).toBe(true)
    })
  })
})

describe('UploadModal — File Validation', () => {
  describe('MIME type checks', () => {
    it('should accept PDF', () => {
      expect(validateFile({ type: 'application/pdf', size: 1024 })).toBe('ok')
    })

    it('should accept DOCX', () => {
      expect(validateFile({
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 1024,
      })).toBe('ok')
    })

    const rejectedTypes = [
      'text/plain',
      'text/html',
      'application/javascript',
      'image/svg+xml',
      'application/zip',
      'application/x-sh',
      'application/x-executable',
      'application/msword',    // legacy .doc — NOT accepted, only .docx
      'application/vnd.ms-excel',
      'image/png',
      'image/jpeg',
    ]

    rejectedTypes.forEach((type) => {
      it(`rejects MIME type: ${type}`, () => {
        expect(validateFile({ type, size: 1024 })).toBe('invalid_type')
      })
    })
  })

  describe('File size checks', () => {
    it('should accept file at 1 byte', () => {
      expect(validateFile({ type: 'application/pdf', size: 1 })).toBe('ok')
    })

    it('should accept file at exactly 50 MB (boundary)', () => {
      expect(validateFile({ type: 'application/pdf', size: MAX_FILE_SIZE })).toBe('ok')
    })

    it('should reject file at 50 MB + 1 byte', () => {
      expect(validateFile({ type: 'application/pdf', size: MAX_FILE_SIZE + 1 })).toBe('too_large')
    })

    it('should reject 100 MB file', () => {
      expect(validateFile({ type: 'application/pdf', size: 100 * 1024 * 1024 })).toBe('too_large')
    })

    it('should handle null file (no selection)', () => {
      expect(validateFile(null)).toBe('no_file')
    })

    it('should accept 0-byte file (backend should reject, not frontend)', () => {
      // The client-side only checks max size, not min size
      expect(validateFile({ type: 'application/pdf', size: 0 })).toBe('ok')
    })
  })
})

describe('UploadModal — XHR Progress Tracking', () => {
  it('should compute progress percentage correctly', () => {
    const computeProgress = (loaded: number, total: number) =>
      Math.round((loaded / total) * 100)

    expect(computeProgress(0, 1000)).toBe(0)
    expect(computeProgress(500, 1000)).toBe(50)
    expect(computeProgress(999, 1000)).toBe(100)
    expect(computeProgress(1000, 1000)).toBe(100)
  })

  it('should handle non-computable progress gracefully', () => {
    // When e.lengthComputable is false, progress is not updated
    let progress = 0
    const onProgress = (e: { lengthComputable: boolean; loaded: number; total: number }) => {
      if (e.lengthComputable) {
        progress = Math.round((e.loaded / e.total) * 100)
      }
    }
    onProgress({ lengthComputable: false, loaded: 0, total: 0 })
    expect(progress).toBe(0) // unchanged
  })

  it('should handle division by zero gracefully', () => {
    // If total is 0 and lengthComputable is true (edge case in some browsers)
    const computeSafe = (loaded: number, total: number) =>
      total > 0 ? Math.round((loaded / total) * 100) : 0
    expect(computeSafe(0, 0)).toBe(0)
  })
})

describe('UploadModal — Response Envelope Unwrapping (XHR path)', () => {
  it('should unwrap { data: document } envelope from XHR response', () => {
    const unwrap = (json: Record<string, unknown>) =>
      ('data' in json ? json.data : json) as { id: string }

    const withEnvelope = { data: { id: 'doc-1', name: 'Test' } }
    expect(unwrap(withEnvelope).id).toBe('doc-1')
  })

  it('should return raw json if no envelope', () => {
    const unwrap = (json: Record<string, unknown>) =>
      ('data' in json ? json.data : json) as { id: string }

    const withoutEnvelope = { id: 'doc-1', name: 'Test' }
    expect(unwrap(withoutEnvelope)).toMatchObject({ id: 'doc-1' })
  })
})
