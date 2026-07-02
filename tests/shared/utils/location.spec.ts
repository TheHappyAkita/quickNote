import { describe, it, expect } from 'vitest'
import { toSlug, sanitizeLocationSlug, decodeCoordSlug, parseFrontmatterName, injectFrontmatterName } from '../../../shared/utils/location'

describe('location utils', () => {
  describe('toSlug', () => {
    it('replaces unsafe chars with underscores', () => {
      expect(toSlug('Deer, John')).toBe('Deer_John')
      expect(toSlug("O'Brien #2!")).toBe('OBrien_2')
      expect(toSlug('Name: With? Special* Chars')).toBe('Name_With_Special_Chars')
    })

    it('collapses multiple underscores and whitespace', () => {
      expect(toSlug('a    b')).toBe('a b')
      expect(toSlug('a,,,b')).toBe('a_b')
      expect(toSlug('a / b')).toBe('a_b')
    })

    it('trims leading and trailing underscores and whitespace', () => {
      expect(toSlug('  _hello_  ')).toBe('hello')
    })
  })

  describe('sanitizeLocationSlug', () => {
    it('encodes coordinates correctly', () => {
      expect(sanitizeLocationSlug('41.3717065,2.1809545')).toBe('41_3717065@2_1809545')
      expect(sanitizeLocationSlug('-41.3717,-2.1809')).toBe('-41_3717@-2_1809')
    })

    it('sanitizes names correctly', () => {
      expect(sanitizeLocationSlug('Berlin / Brandenburger Tor')).toBe('Berlin Brandenburger Tor')
    })
  })

  describe('decodeCoordSlug', () => {
    it('decodes coordinate slugs correctly', () => {
      expect(decodeCoordSlug('41_3717065@2_1809545')).toBe('41.3717065,2.1809545')
      expect(decodeCoordSlug('-41_3717@-2_1809')).toBe('-41.3717,-2.1809')
    })

    it('returns null for non-coordinate slugs', () => {
      expect(decodeCoordSlug('Berlin')).toBeNull()
    })
  })

  describe('frontmatter name utils', () => {
    it('parses frontmatter name', () => {
      const content = '---\nname: Test Name\nlat: 1\n---\nContent'
      expect(parseFrontmatterName(content)).toBe('Test Name')
    })

    it('injects frontmatter name into empty content', () => {
      const content = 'Content'
      const injected = injectFrontmatterName(content, 'New Name')
      expect(injected).toContain('name: New Name')
      expect(injected).toContain('Content')
    })

    it('updates existing frontmatter name', () => {
      const content = '---\nname: Old Name\n---\nContent'
      const updated = injectFrontmatterName(content, 'New Name')
      expect(updated).toContain('name: New Name')
      expect(updated).not.toContain('name: Old Name')
    })
  })
})
