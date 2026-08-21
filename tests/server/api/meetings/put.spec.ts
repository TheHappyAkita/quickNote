// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { writeMeeting, readMeeting } from '../../../../server/utils/meetings'

describe('Meetings API - PUT /api/meetings/:name', () => {
  let testDir: string

  beforeEach(async () => {
    testDir = join(tmpdir(), `quicknote-meetings-put-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
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

  it('should create a new meeting', async () => {
    const content = '# New Meeting\n\nContent here'
    await writeMeeting('New Meeting', content)

    const result = await readMeeting('New Meeting')
    expect(result).toBe(content)
  })

  it('should update existing meeting', async () => {
    await writeMeeting('Update Test', '# Original Content')

    const updatedContent = '# Updated Content\n\nNew information'
    await writeMeeting('Update Test', updatedContent)

    const result = await readMeeting('Update Test')
    expect(result).toBe(updatedContent)
  })

  it('should reject invalid meeting names', async () => {
    await expect(writeMeeting('Invalid@Name', 'content')).rejects.toThrow('Invalid meeting name')
    await expect(writeMeeting('Invalid/Name', 'content')).rejects.toThrow('Invalid meeting name')
    await expect(writeMeeting('', 'content')).rejects.toThrow('Invalid meeting name')
  })

  it('should handle meeting with frontmatter', async () => {
    const content = `---
date: 2026-08-21 14:30
timezone: America/New_York
topic: Product Review
attendees: [John, Jane, Bob]
---
# Product Review

## Agenda
1. Feature demo
2. Feedback session`

    await writeMeeting('Product Review', content)

    const result = await readMeeting('Product Review')
    expect(result).toBe(content)
  })

  it('should preserve existing content when updating', async () => {
    const originalContent = `---
date: 2026-08-21 10:00
timezone: Europe/Berlin
---
# Original Meeting

Original notes`

    await writeMeeting('Preserve Test', originalContent)

    const updatedContent = `---
date: 2026-08-21 15:00
timezone: Europe/Berlin
topic: Updated Topic
---
# Original Meeting

Updated notes with more details`

    await writeMeeting('Preserve Test', updatedContent)

    const result = await readMeeting('Preserve Test')
    expect(result).toBe(updatedContent)
  })

  it('should handle special characters in content', async () => {
    const content = '# Meeting with Müller\n\nDiscussion about café locations\n\nAttendees: José, François'
    await writeMeeting('Special Chars', content)

    const result = await readMeeting('Special Chars')
    expect(result).toBe(content)
  })

  it('should enforce max name length', async () => {
    const longName = 'a'.repeat(101)
    await expect(writeMeeting(longName, 'content')).rejects.toThrow('Invalid meeting name')
  })

  it('should accept names at max length boundary', async () => {
    const maxLengthName = 'a'.repeat(100)
    await expect(writeMeeting(maxLengthName, '# Content')).resolves.not.toThrow()
  })
})
