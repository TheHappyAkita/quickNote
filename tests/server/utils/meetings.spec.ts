// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import {
  isValidMeetingName,
  listMeetings,
  readMeeting,
  writeMeeting,
  deleteMeeting,
  listMeetingsWithMeta,
  renameMeetingFile,
} from '../../../server/utils/meetings'

describe('Meetings Utilities', () => {
  let testDir: string

  beforeEach(async () => {
    testDir = join(tmpdir(), `quicknote-meetings-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    await mkdir(testDir, { recursive: true })
    process.env.NOTES_DIR = testDir
  })

  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true, force: true })
    } catch {
      // Cleanup failed, ignore
    }
  })

  describe('isValidMeetingName', () => {
    it('should accept valid meeting names', () => {
      expect(isValidMeetingName('Q3 Planning')).toBe(true)
      expect(isValidMeetingName('Team Sync 2026')).toBe(true)
      expect(isValidMeetingName('Sprint-Review')).toBe(true)
      expect(isValidMeetingName('Meeting_Notes')).toBe(true)
      expect(isValidMeetingName('Café Meeting')).toBe(true)
    })

    it('should reject invalid meeting names', () => {
      expect(isValidMeetingName('')).toBe(false)
      expect(isValidMeetingName('a'.repeat(101))).toBe(false)
      expect(isValidMeetingName('Invalid@Name')).toBe(false)
      expect(isValidMeetingName('Invalid/Name')).toBe(false)
      expect(isValidMeetingName('Invalid\\Name')).toBe(false)
    })

    it('should accept names with special characters', () => {
      expect(isValidMeetingName('Müller Meeting')).toBe(true)
      expect(isValidMeetingName('José Planning')).toBe(true)
      expect(isValidMeetingName('Café Meeting')).toBe(true)
    })
  })

  describe('writeMeeting and readMeeting', () => {
    it('should write and read a meeting', async () => {
      const name = 'Q3 Planning'
      const content = '# Q3 Planning\n\nAgenda items'
      await writeMeeting(name, content)

      const read = await readMeeting(name)
      expect(read).toBe(content)
    })

    it('should return null for non-existent meeting', async () => {
      const read = await readMeeting('NonExistent')
      expect(read).toBeNull()
    })

    it('should reject invalid meeting names', async () => {
      await expect(writeMeeting('Invalid@Name', 'content')).rejects.toThrow('Invalid meeting name')
    })

    it('should handle meeting with frontmatter', async () => {
      const name = 'Team Sync'
      const content = '---\ndate: 2026-08-21 10:00\ntimezone: Europe/Berlin\ntopic: Sprint Review\nattendees: [Alice, Bob]\n---\n# Meeting Notes'
      await writeMeeting(name, content)

      const read = await readMeeting(name)
      expect(read).toBe(content)
    })
  })

  describe('listMeetings', () => {
    it('should list all meetings', async () => {
      await writeMeeting('Q3 Planning', '# Q3 Planning')
      await writeMeeting('Team Sync', '# Team Sync')
      await writeMeeting('Sprint Review', '# Sprint Review')

      const meetings = await listMeetings()
      expect(meetings).toHaveLength(3)
      expect(meetings).toContain('Q3 Planning')
      expect(meetings).toContain('Team Sync')
      expect(meetings).toContain('Sprint Review')
    })

    it('should return empty array when no meetings exist', async () => {
      const meetings = await listMeetings()
      expect(meetings).toEqual([])
    })

    it('should sort meetings alphabetically', async () => {
      await writeMeeting('Zebra Meeting', '# Zebra')
      await writeMeeting('Alpha Meeting', '# Alpha')
      await writeMeeting('Beta Meeting', '# Beta')

      const meetings = await listMeetings()
      expect(meetings).toEqual(['Alpha Meeting', 'Beta Meeting', 'Zebra Meeting'])
    })
  })

  describe('deleteMeeting', () => {
    it('should delete a meeting', async () => {
      await writeMeeting('ToDelete', '# Meeting')
      let meetings = await listMeetings()
      expect(meetings).toContain('ToDelete')

      await deleteMeeting('ToDelete')
      meetings = await listMeetings()
      expect(meetings).not.toContain('ToDelete')
    })

    it('should not throw when deleting non-existent meeting', async () => {
      await expect(deleteMeeting('NonExistent')).resolves.not.toThrow()
    })

    it('should reject invalid meeting names', async () => {
      await expect(deleteMeeting('Invalid@Name')).rejects.toThrow('Invalid meeting name')
    })
  })

  describe('listMeetingsWithMeta', () => {
    it('should list meetings with metadata', async () => {
      await writeMeeting('Q3 Planning', '# Q3 Planning\n\n#planning #quarterly')
      await writeMeeting('Team Sync', '---\nname: Weekly Team Sync\n---\n# Team Sync\n\n#weekly')

      const meta = await listMeetingsWithMeta()
      expect(meta).toHaveLength(2)

      const q3 = meta.find(m => m.slug === 'Q3 Planning')
      expect(q3).toMatchObject({
        name: 'Q3 Planning',
        slug: 'Q3 Planning',
        tags: expect.arrayContaining(['planning', 'quarterly']),
      })

      const sync = meta.find(m => m.slug === 'Team Sync')
      expect(sync).toMatchObject({
        name: 'Weekly Team Sync',
        slug: 'Team Sync',
        tags: expect.arrayContaining(['weekly']),
      })
    })

    it('should return empty array when no meetings exist', async () => {
      const meta = await listMeetingsWithMeta()
      expect(meta).toEqual([])
    })

    it('should extract tags from content', async () => {
      await writeMeeting('Tagged Meeting', '# Meeting\n\n#tag1 #tag2 #tag3')

      const meta = await listMeetingsWithMeta()
      expect(meta[0].tags).toEqual(expect.arrayContaining(['tag1', 'tag2', 'tag3']))
    })

    it('should extract tags from frontmatter', async () => {
      await writeMeeting('Frontmatter Tags', '---\ntags: [planning, review, urgent]\n---\n# Meeting')

      const meta = await listMeetingsWithMeta()
      expect(meta[0].tags).toEqual(expect.arrayContaining(['planning', 'review', 'urgent']))
    })

    it('should combine frontmatter and content tags', async () => {
      await writeMeeting('Combined Tags', '---\ntags: [planning, review]\n---\n# Meeting\n\n#urgent #important')

      const meta = await listMeetingsWithMeta()
      expect(meta[0].tags).toEqual(expect.arrayContaining(['planning', 'review', 'urgent', 'important']))
    })
  })

  describe('attendees with commas in names', () => {
    it('should handle person mentions with commas in names', async () => {
      const content = `---
attendees: [@[[Doe, John]], @[[Smith, Jane]], @[[Brown, Alice]]]

---
# Meeting Notes`

      await writeMeeting('Comma Names Test', content)
      const result = await readMeeting('Comma Names Test')
      expect(result).toBe(content)
    })

    it('should handle mixed attendees with and without commas', async () => {
      const content = `---
attendees: [@[[Doe, John]], Alice, @[[Brown, Bob]], Charlie]

---
# Meeting Notes`

      await writeMeeting('Mixed Attendees', content)
      const result = await readMeeting('Mixed Attendees')
      expect(result).toBe(content)
    })

    it('should preserve attendees not in persons list', async () => {
      const content = `---
attendees: [@[[New Person]], @[[Another New Person]], @[[Doe, John]]]

---
# Meeting Notes`

      await writeMeeting('New Attendees Test', content)
      const result = await readMeeting('New Attendees Test')
      expect(result).toBe(content)
      
      // Verify all attendees are preserved
      expect(result).toContain('@[[New Person]]')
      expect(result).toContain('@[[Another New Person]]')
      expect(result).toContain('@[[Doe, John]]')
    })

    it('should preserve plain name attendees mixed with person mentions', async () => {
      const content = `---
attendees: [@[[Smith, Alice]], @[[Johnson, Bob]], @[[Williams, Charlie]], @[[david]]]

---
# Meeting Notes`

      await writeMeeting('Mixed Plain Names', content)
      const result = await readMeeting('Mixed Plain Names')
      expect(result).toBe(content)
      
      // Verify all attendees including plain names are preserved
      expect(result).toContain('@[[Smith, Alice]]')
      expect(result).toContain('@[[Johnson, Bob]]')
      expect(result).toContain('@[[Williams, Charlie]]')
      expect(result).toContain('@[[david]]')
    })
  })

  describe('renameMeetingFile', () => {
    it('should rename a meeting file', async () => {
      await writeMeeting('OldName', '# Meeting Content')

      await renameMeetingFile('OldName', 'NewName')

      const oldContent = await readMeeting('OldName')
      expect(oldContent).toBeNull()

      const newContent = await readMeeting('NewName')
      expect(newContent).toBe('# Meeting Content')
    })

    it('should not rename if old and new names are the same', async () => {
      await writeMeeting('SameName', '# Content')

      await renameMeetingFile('SameName', 'SameName')

      const content = await readMeeting('SameName')
      expect(content).toBe('# Content')
    })

    it('should not overwrite existing file', async () => {
      await writeMeeting('Existing', '# Existing Content')
      await writeMeeting('ToRename', '# To Rename Content')

      await renameMeetingFile('ToRename', 'Existing')

      const existing = await readMeeting('Existing')
      expect(existing).toBe('# Existing Content')

      const toRename = await readMeeting('ToRename')
      expect(toRename).toBe('# To Rename Content')
    })
  })
})
