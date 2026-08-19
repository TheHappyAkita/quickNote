import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { join } from 'path'
import { rm, mkdir, writeFile, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { 
  getNotesDir, 
  writeNote, 
  readNote, 
  listNotes, 
  deleteNote,
  extractLinks,
  extractPersonMentions,
  extractLocationMentions,
  parseTags,
  buildGraph
} from '../../../server/utils/notes'
import { writePage, readPage, listPages, isValidPageName } from '../../../server/utils/pages'

const TEST_NOTES_DIR = join(process.cwd(), '__test_notes_dir')

describe('server notes utils', () => {
  // Point NOTES_DIR to our test directory
  beforeEach(async () => {
    process.env.NOTES_DIR = TEST_NOTES_DIR
    if (existsSync(TEST_NOTES_DIR)) {
      await rm(TEST_NOTES_DIR, { recursive: true, force: true })
    }
    await mkdir(TEST_NOTES_DIR, { recursive: true })
  })

  afterEach(async () => {
    if (existsSync(TEST_NOTES_DIR)) {
      await rm(TEST_NOTES_DIR, { recursive: true, force: true })
    }
  })

  describe('daily notes', () => {
    it('writes and reads a daily note', async () => {
      const date = '2026-07-02'
      const content = 'Test content'
      await writeNote(date, content)
      
      const read = await readNote(date)
      expect(read).toBe(content)
    })

    it('lists daily notes', async () => {
      await writeNote('2026-07-01', 'day 1')
      await writeNote('2026-07-02', 'day 2')
      await writeNote('2026-07-03', 'day 3')
      
      const list = await listNotes()
      expect(list).toEqual(['2026-07-01', '2026-07-02', '2026-07-03'])
    })

    it('deletes a daily note', async () => {
      const date = '2026-07-02'
      await writeNote(date, 'to be deleted')
      expect(existsSync(join(TEST_NOTES_DIR, `${date}.md`))).toBe(true)
      
      await deleteNote(date)
      expect(existsSync(join(TEST_NOTES_DIR, `${date}.md`))).toBe(false)
    })

    it('throws error for invalid date format', async () => {
      await expect(writeNote('invalid-date', 'content')).rejects.toThrow('Invalid date format')
    })
  })

  describe('named pages', () => {
    it('writes and reads a page', async () => {
      const name = 'TestPage'
      const content = 'Page content'
      await writePage(name, content)
      
      const read = await readPage(name)
      expect(read).toBe(content)
    })

    it('lists pages', async () => {
      await writePage('PageA', 'A')
      await writePage('PageB', 'B')
      
      const list = await listPages()
      expect(list).toContain('PageA')
      expect(list).toContain('PageB')
    })

    it('validates page names correctly', () => {
      expect(isValidPageName('ValidPage')).toBe(true)
      expect(isValidPageName('Valid-Page_123')).toBe(true)
      expect(isValidPageName('Invalid/Page')).toBe(false)
      expect(isValidPageName('')).toBe(false)
    })
  })

  describe('knowledge graph', () => {
    it('includes tags from daily notes as graph nodes and edges', async () => {
      await writeNote('2026-07-02', `---\ntags: [project-x]\n---\nDaily note about country`)

      const graph = await buildGraph()

      expect(graph.nodes).toContainEqual({
        data: { id: 'kw:project-x', label: 'project-x', type: 'keyword', weight: 1 },
      })
      expect(graph.edges).toContainEqual({
        data: { id: '2026-07-02->kw:project-x', source: '2026-07-02', target: 'kw:project-x', type: 'keyword' },
      })
      expect(graph.edges).toContainEqual({
        data: { id: '2026-07-02->kw:country', source: '2026-07-02', target: 'kw:country', type: 'keyword' },
      })
    })
  })

  describe('extraction utilities', () => {
    it('extracts wikilinks correctly', () => {
      const content = 'Link to [[2026-07-01]] and [[Some Page]]'
      const links = extractLinks(content)
      expect(links).toEqual(['2026-07-01', 'Some Page'])
    })

    it('extracts person mentions', () => {
      const content = 'Hello @[[Doe, John]] and @[[Alice]]'
      const mentions = extractPersonMentions(content)
      expect(mentions).toEqual(['Doe, John', 'Alice'])
    })

    it('extracts location mentions', () => {
      const content = 'Visit &[[Berlin]] or &[[Paris|48.85,2.35]]'
      const mentions = extractLocationMentions(content)
      expect(mentions).toEqual(['Berlin', 'Paris'])
    })

    it('parses tags (inline and frontmatter)', () => {
      const content = `---
tags: [tag1, tag2]
---
#tag3 Some text #tag4`
      const tags = parseTags(content)
      expect(tags).toEqual(['tag1', 'tag2', 'tag3', 'tag4'])
    })
  })
})
