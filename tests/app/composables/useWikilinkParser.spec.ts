import { describe, it, expect } from 'vitest'
import { useWikilinkParser } from '../../../app/composables/useWikilinkParser'

describe('useWikilinkParser', () => {
  const { parseWikilinks } = useWikilinkParser()

  it('parses standard date links', () => {
    const text = 'Check [[2026-07-02]]'
    const html = parseWikilinks(text)
    expect(html).toContain('<a href="/note/2026-07-02" class="wiki-link">📅 2026-07-02</a>')
  })

  it('parses date and time links', () => {
    const text = 'Meeting [[2026-07-02 14:30]]'
    const html = parseWikilinks(text)
    expect(html).toContain('<a href="/note/2026-07-02 14:30" class="wiki-link">📅 2026-07-02 ⏰ 14:30</a>')
  })

  it('parses person mentions', () => {
    const text = 'Hello @[[Doe, John]]'
    const html = parseWikilinks(text)
    expect(html).toContain('<a href="/person/Doe%2C%20John" class="wiki-link person-link">👤 Doe, John</a>')
  })

  it('parses named location links', () => {
    const text = 'Visit &[[Berlin]]'
    const html = parseWikilinks(text)
    expect(html).toContain('<a href="/location/Berlin" class="wiki-link location-link">📍 Berlin</a>')
  })

  it('parses coordinate-only location links', () => {
    const text = 'Visit &[[41.37,2.18]]'
    const html = parseWikilinks(text)
    expect(html).toContain('<a href="/location/41_37%402_18" class="wiki-link location-link">📍 41.37000, 2.18000</a>')
  })

  it('parses location with nickname override', () => {
    const text = 'Visit &[[41.37,2.18]](The Beach)'
    const html = parseWikilinks(text)
    expect(html).toContain('<a href="/location/41_37%402_18" class="wiki-link location-link">📍 The Beach</a>')
  })

  it('parses page links', () => {
    const text = 'Read [[Project Alpha]]'
    const html = parseWikilinks(text)
    expect(html).toContain('<a href="/page/Project Alpha" class="wiki-link page-link">📄 Project Alpha</a>')
  })

  it('parses email addresses', () => {
    const text = 'Contact test@example.com'
    const html = parseWikilinks(text)
    expect(html).toContain('<a href="mailto:test@example.com" class="wiki-link">📧 test@example.com</a>')
  })

  it('parses emoji shortcodes', () => {
    const text = 'I love :coffee:'
    const html = parseWikilinks(text)
    expect(html).toContain('I love ☕')
  })
})
