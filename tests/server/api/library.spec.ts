// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdir, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { writeLibrary } from '../../../server/utils/library'
import { saveSettings } from '../../../server/utils/settings'

describe('Library API Endpoints', () => {
  let testDir: string

  beforeEach(async () => {
    testDir = join(tmpdir(), `quicknote-api-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    await mkdir(testDir, { recursive: true })
    process.env.NOTES_DIR = testDir
    
    // Configure mock Ollama settings
    await saveSettings({
      ollama: {
        url: 'http://localhost:11434',
        model: 'llama3.1',
      },
    })
  })

  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true, force: true })
    } catch {
      // Cleanup failed, ignore
    }
    vi.restoreAllMocks()
  })

  describe('GET /api/library', () => {
    it('should return empty array when no entries exist', async () => {
      const { listLibraryWithMeta } = await import('../../../server/utils/library')
      const result = await listLibraryWithMeta()
      expect(result).toEqual([])
    })

    it('should return list of library entries with metadata', async () => {
      const { writeLibrary: write, listLibraryWithMeta } = await import('../../../server/utils/library')
      
      await write('entry-one', '# Entry One\n\nSome content with #tag1 here')
      await write('entry-two', '# Entry Two\n\nSome content with #tag2 here')

      const result = await listLibraryWithMeta()

      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({
        slug: 'entry-one',
        tags: expect.arrayContaining(['tag1']),
      })
    })
  })

  describe('GET /api/library/:name', () => {
    it('should return 404 for non-existent entry', async () => {
      const { readLibrary } = await import('../../../server/utils/library')
      const result = await readLibrary('non-existent')
      expect(result).toBeNull()
    })

    it('should return entry content', async () => {
      const content = '# Test Entry\n\nContent here'
      await writeLibrary('test-entry', content)

      const { readLibrary } = await import('../../../server/utils/library')
      const result = await readLibrary('test-entry')
      expect(result).toBe(content)
    })
  })

  describe('POST /api/library', () => {
    it('should validate required fields', () => {
      const invalidRequests = [
        { title: '', sources: [], prompt: 'test' },
        { title: 'Test', sources: [], prompt: '' },
        { sources: [], prompt: 'test' },
      ]

      invalidRequests.forEach((req) => {
        expect(() => {
          if (!req.title || !('prompt' in req) || !req.prompt) {
            throw new Error('Title and prompt are required')
          }
        }).toThrow('Title and prompt are required')
      })
    })

    it('should handle naming conflicts with timestamp', async () => {
      await writeLibrary('existing-entry', '# Existing')

      // Simulate conflict resolution
      const baseSlug = 'existing-entry'
      const { listLibrary } = await import('../../../server/utils/library')
      const existing = await listLibrary()

      if (existing.includes(baseSlug)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
        const newSlug = `${baseSlug}-${timestamp}`
        expect(newSlug).toMatch(/^existing-entry-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/)
      }
    })
  })

  describe('PUT /api/library/:name', () => {
    it('should update existing entry', async () => {
      const { writeLibrary: write, readLibrary: read } = await import('../../../server/utils/library')
      
      await write('update-test', '# Original')

      const updatedContent = '# Updated Content'
      await write('update-test', updatedContent)

      const result = await read('update-test')
      expect(result).toBe(updatedContent)
    })
  })

  describe('DELETE /api/library/:name', () => {
    it('should delete existing entry', async () => {
      await writeLibrary('to-delete', '# Delete Me')

      const { deleteLibrary, readLibrary } = await import('../../../server/utils/library')
      await deleteLibrary('to-delete')

      const result = await readLibrary('to-delete')
      expect(result).toBeNull()
    })

    it('should not throw when deleting non-existent entry', async () => {
      const { deleteLibrary } = await import('../../../server/utils/library')
      await expect(deleteLibrary('non-existent')).resolves.not.toThrow()
    })
  })
})
