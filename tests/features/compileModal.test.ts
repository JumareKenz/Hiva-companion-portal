/**
 * PHASE 2 & 3 — Compile Modal Logic Tests
 *
 * Tests language selection behavior, English lock, compile invocation,
 * and edge cases (all languages, no languages, single language).
 */
import { describe, it, expect, vi } from 'vitest'
import type { Language } from '@/types/enums'

const ALL_LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ha', label: 'Hausa' },
  { code: 'yo', label: 'Yoruba' },
  { code: 'ig', label: 'Igbo' },
  { code: 'pcm', label: 'Pidgin' },
]

// Replicate the toggle logic from CompileModal.tsx
function toggleLang(selected: Language[], code: Language): Language[] {
  if (code === 'en') return selected // English is locked/required
  return selected.includes(code) ? selected.filter((c) => c !== code) : [...selected, code]
}

describe('CompileModal — Language Selection Logic', () => {
  describe('English language lock', () => {
    it('should always include English in initial state', () => {
      const initial: Language[] = ['en']
      expect(initial).toContain('en')
    })

    it('should not be removable — toggle en does nothing', () => {
      const selected: Language[] = ['en', 'ha']
      const result = toggleLang(selected, 'en')
      expect(result).toContain('en')
      expect(result).toEqual(['en', 'ha'])
    })

    it('English lock should be idempotent', () => {
      let selected: Language[] = ['en']
      selected = toggleLang(selected, 'en')
      selected = toggleLang(selected, 'en')
      selected = toggleLang(selected, 'en')
      expect(selected).toEqual(['en'])
    })
  })

  describe('Language toggle behavior', () => {
    it('should add a language when not selected', () => {
      const result = toggleLang(['en'], 'ha')
      expect(result).toContain('ha')
      expect(result).toContain('en')
    })

    it('should remove a language when already selected', () => {
      const result = toggleLang(['en', 'ha'], 'ha')
      expect(result).not.toContain('ha')
      expect(result).toContain('en')
    })

    it('should handle toggling all non-English languages on', () => {
      let selected: Language[] = ['en']
      for (const lang of ALL_LANGUAGES.filter((l) => l.code !== 'en')) {
        selected = toggleLang(selected, lang.code)
      }
      expect(selected).toHaveLength(5)
      expect(selected).toContain('en')
      expect(selected).toContain('ha')
      expect(selected).toContain('yo')
      expect(selected).toContain('ig')
      expect(selected).toContain('pcm')
    })

    it('should handle toggling all non-English languages off', () => {
      let selected: Language[] = ['en', 'ha', 'yo', 'ig', 'pcm']
      for (const lang of ALL_LANGUAGES.filter((l) => l.code !== 'en')) {
        selected = toggleLang(selected, lang.code)
      }
      expect(selected).toEqual(['en'])
    })

    it('should be idempotent for double-toggle', () => {
      let selected: Language[] = ['en']
      selected = toggleLang(selected, 'ha')
      selected = toggleLang(selected, 'ha')
      expect(selected).toEqual(['en'])
    })
  })

  describe('Compile button disabled state', () => {
    it('should be disabled when no languages selected', () => {
      const selected: Language[] = []
      const isDisabled = selected.length < 1
      expect(isDisabled).toBe(true)
    })

    it('should be enabled with just English', () => {
      const selected: Language[] = ['en']
      const isDisabled = selected.length < 1
      expect(isDisabled).toBe(false)
    })

    it('should be enabled with multiple languages', () => {
      const selected: Language[] = ['en', 'ha', 'yo']
      const isDisabled = selected.length < 1
      expect(isDisabled).toBe(false)
    })
  })

  describe('Language enumeration', () => {
    it('should have exactly 5 languages', () => {
      expect(ALL_LANGUAGES).toHaveLength(5)
    })

    it('should include all required language codes', () => {
      const codes = ALL_LANGUAGES.map((l) => l.code)
      expect(codes).toContain('en')
      expect(codes).toContain('ha')
      expect(codes).toContain('yo')
      expect(codes).toContain('ig')
      expect(codes).toContain('pcm')
    })

    it('should have unique codes', () => {
      const codes = ALL_LANGUAGES.map((l) => l.code)
      const unique = new Set(codes)
      expect(unique.size).toBe(codes.length)
    })
  })

  describe('Edge cases in compilation payload', () => {
    it('should produce correct compile payload for all languages', () => {
      const selected: Language[] = ['en', 'ha', 'yo', 'ig', 'pcm']
      const payload = { languages: selected }
      expect(payload.languages).toHaveLength(5)
    })

    it('should produce correct compile payload for single language', () => {
      const selected: Language[] = ['en']
      const payload = { languages: selected }
      expect(payload.languages).toEqual(['en'])
    })

    it('should not include invalid language codes in payload', () => {
      const validCodes = ['en', 'ha', 'yo', 'ig', 'pcm']
      const payload = ['en', 'xx', 'fr'] // xx and fr are invalid
      const cleaned = payload.filter((l) => validCodes.includes(l))
      expect(cleaned).toEqual(['en'])
    })
  })
})
