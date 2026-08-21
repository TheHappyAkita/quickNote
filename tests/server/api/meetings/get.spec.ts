// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { writeMeeting } from '../../../../server/utils/meetings'

describe('Meetings API - GET /api/meetings/:name', () => {
  let testDir: string

  beforeEach(async () => {
    testDir = join(tmpdir(), `quicknote-meetings-get-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
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

  it('should return null for non-existent meeting', async () => {
    const { readMeeting } = await import('../../../../server/utils/meetings')
    const result = await readMeeting('NonExistent')
    expect(result).toBeNull()
  })

  it('should return meeting content', async () => {
    const content = '# Q3 Planning\n\nAgenda items here'
    await writeMeeting('Q3 Planning', content)

    const { readMeeting } = await import('../../../../server/utils/meetings')
    const result = await readMeeting('Q3 Planning')
    expect(result).toBe(content)
  })

  it('should return meeting with frontmatter', async () => {
    const content = `---
date: 2026-08-21 10:00
timezone: Europe/Berlin
topic: Sprint Review
attendees: [Alice, Bob]
---
# Sprint Review

## Completed Items
- Feature A
- Feature B`

    await writeMeeting('Sprint Review', content)

    const { readMeeting } = await import('../../../../server/utils/meetings')
    const result = await readMeeting('Sprint Review')
    expect(result).toBe(content)
  })

  it('should handle special characters in meeting names', async () => {
    const content = '# Café Meeting\n\nDiscussion about coffee'
    await writeMeeting('Café Meeting', content)

    const { readMeeting } = await import('../../../../server/utils/meetings')
    const result = await readMeeting('Café Meeting')
    expect(result).toBe(content)
  })

  it('should handle meetings with tags', async () => {
    const content = '# Team Sync\n\nDiscussion #important #urgent\n\nAction items #followup'
    await writeMeeting('Team Sync', content)

    const { readMeeting } = await import('../../../../server/utils/meetings')
    const result = await readMeeting('Team Sync')
    expect(result).toBe(content)
  })
})
