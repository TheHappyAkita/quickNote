// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdir, rm, writeFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import {
  listLibrary,
  readLibrary,
  writeLibrary,
  deleteLibrary,
  listLibraryWithMeta,
  renameLibraryFile,
} from '../../../server/utils/library'

describe('Library Utilities', () => {
  let testDir: string

  beforeEach(async () => {
    testDir = join(tmpdir(), `quicknote-library-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    await mkdir(testDir, { recursive: true })
    process.env.NOTES_DIR = testDir
    vi.clearAllMocks()
  })

  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true, force: true })
    } catch {
      // Cleanup failed, ignore
    }
  })

  describe('listLibrary', () => {
    it('should return empty array when library directory does not exist', async () => {
      const result = await listLibrary()
      expect(result).toEqual([])
    })

    it('should return list of library entry slugs', async () => {
      const libraryDir = join(testDir, 'library')
      await mkdir(libraryDir, { recursive: true })
      await writeFile(join(libraryDir, 'entry-one.md'), '# Entry One')
      await writeFile(join(libraryDir, 'entry-two.md'), '# Entry Two')

      const result = await listLibrary()
      expect(result).toEqual(['entry-one', 'entry-two'])
    })

    it('should filter out non-markdown files', async () => {
      const libraryDir = join(testDir, 'library')
      await mkdir(libraryDir, { recursive: true })
      await writeFile(join(libraryDir, 'valid.md'), '# Valid')
      await writeFile(join(libraryDir, 'invalid.txt'), 'Not markdown')

      const result = await listLibrary()
      expect(result).toEqual(['valid'])
    })
  })

  describe('readLibrary', () => {
    it('should return null for invalid names', async () => {
      const result = await readLibrary('invalid/name')
      expect(result).toBeNull()
    })

    it('should return null for non-existent entry', async () => {
      const result = await readLibrary('non-existent')
      expect(result).toBeNull()
    })

    it('should return content for existing entry', async () => {
      const libraryDir = join(testDir, 'library')
      await mkdir(libraryDir, { recursive: true })
      const content = '# Test Entry\n\nContent here'
      await writeFile(join(libraryDir, 'test-entry.md'), content)

      const result = await readLibrary('test-entry')
      expect(result).toBe(content)
    })
  })

  describe('writeLibrary', () => {
    it('should throw error for invalid name', async () => {
      await expect(writeLibrary('invalid/name', 'content')).rejects.toThrow('Invalid library name')
    })

    it('should create library directory if it does not exist', async () => {
      await writeLibrary('new-entry', '# New Entry')
      const result = await readLibrary('new-entry')
      expect(result).toBe('# New Entry')
    })

    it('should write content to file', async () => {
      const content = '# Test\n\nSome content'
      await writeLibrary('test', content)
      const result = await readLibrary('test')
      expect(result).toBe(content)
    })
  })

  describe('deleteLibrary', () => {
    it('should throw error for invalid name', async () => {
      await expect(deleteLibrary('invalid/name')).rejects.toThrow('Invalid library name')
    })

    it('should delete existing entry', async () => {
      await writeLibrary('to-delete', '# Delete Me')
      await deleteLibrary('to-delete')
      const result = await readLibrary('to-delete')
      expect(result).toBeNull()
    })

    it('should not throw when deleting non-existent entry', async () => {
      await expect(deleteLibrary('non-existent')).resolves.not.toThrow()
    })
  })

  describe('listLibraryWithMeta', () => {
    it('should return empty array when no entries exist', async () => {
      const result = await listLibraryWithMeta()
      expect(result).toEqual([])
    })

    it('should return metadata for entries', async () => {
      await writeLibrary('entry-one', '# Entry One\n\n#tag1 #tag2')
      await writeLibrary('entry-two', '---\ntags: [tag3]\n---\n# Entry Two')

      const result = await listLibraryWithMeta()
      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({
        slug: 'entry-one',
        name: 'entry-one',
        tags: expect.arrayContaining(['tag1', 'tag2']),
      })
      expect(result[1]).toMatchObject({
        slug: 'entry-two',
        name: 'entry-two',
        tags: expect.arrayContaining(['tag3']),
      })
    })

    it('should use frontmatter name when available', async () => {
      await writeLibrary('slug-name', '---\nname: Display Name\n---\n# Content')

      const result = await listLibraryWithMeta()
      expect(result[0]).toMatchObject({
        slug: 'slug-name',
        name: 'Display Name',
      })
    })
  })

  describe('renameLibraryFile', () => {
    it('should rename file when old exists and new does not', async () => {
      await writeLibrary('old-name', '# Old')
      await renameLibraryFile('old-name', 'new-name')

      const oldContent = await readLibrary('old-name')
      const newContent = await readLibrary('new-name')

      expect(oldContent).toBeNull()
      expect(newContent).toBe('# Old')
    })

    it('should not rename if old and new are the same', async () => {
      await writeLibrary('same-name', '# Same')
      await renameLibraryFile('same-name', 'same-name')

      const content = await readLibrary('same-name')
      expect(content).toBe('# Same')
    })

    it('should not overwrite existing file', async () => {
      await writeLibrary('old', '# Old')
      await writeLibrary('new', '# New')
      await renameLibraryFile('old', 'new')

      const newContent = await readLibrary('new')
      expect(newContent).toBe('# New')
    })
  })
})
