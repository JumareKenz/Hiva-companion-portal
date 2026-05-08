import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cn } from '@/lib/utils'

describe('lib/utils.ts — cn() utility', () => {
  describe('clsx behavior', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('should handle undefined/null gracefully', () => {
      expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
    })

    it('should handle empty strings', () => {
      expect(cn('', 'bar', '')).toBe('bar')
    })

    it('should handle objects with boolean values', () => {
      const isActive = true
      const isDisabled = false
      expect(cn('base', { 'text-primary': isActive, 'text-muted': isDisabled })).toBe('base text-primary')
    })

    it('should handle string arrays', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar')
    })

    it('should handle mixed inputs', () => {
      expect(cn('base', ['array'], { obj: true }, undefined, null)).toBe('base array obj')
    })
  })

  describe('tailwind-merge behavior', () => {
    it('should deduplicate conflicting Tailwind classes (last wins)', () => {
      expect(cn('text-sm text-base text-lg')).toBe('text-lg')
      expect(cn('p-4 p-6')).toBe('p-6')
    })

    it('should combine non-conflicting classes', () => {
      expect(cn('text-sm', 'p-4')).toBe('text-sm p-4')
    })
  })
})

describe('cn() with design tokens', () => {
  it('should support CSS variable references', () => {
    expect(cn('bg-[var(--accent-600)]', 'text-[var(--text-primary)]')).toBe('bg-[var(--accent-600)] text-[var(--text-primary)]')
  })

  it('should support arbitrary values', () => {
    expect(cn('w-[420px]', 'h-[100px]')).toBe('w-[420px] h-[100px]')
  })
})