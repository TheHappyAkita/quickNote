// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { writeMeeting, readMeeting, deleteMeeting, listMeetings } from '../../../../server/utils/meetings'

describe('Meetings API - DELETE /api/meetings/:name', () => {
  let testDir: string

  beforeEach(async () => {
    testDir = join(tmpdir(), `quicknote-meetings-delete-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
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

  it('should delete existing meeting', async () => {
    await writeMeeting('To Delete', '# Meeting to delete')

    let meetings = await listMeetings()
    expect(meetings).toContain('To Delete')

    await deleteMeeting('To Delete')

    meetings = await listMeetings()
    expect(meetings).not.toContain('To Delete')

    const content = await readMeeting('To Delete')
    expect(content).toBeNull()
  })

  it('should not throw when deleting non-existent meeting', async () => {
    await expect(deleteMeeting('NonExistent')).resolves.not.toThrow()
  })

  it('should reject invalid meeting names', async () => {
    await expect(deleteMeeting('Invalid@Name')).rejects.toThrow('Invalid meeting name')
    await expect(deleteMeeting('Invalid/Name')).rejects.toThrow('Invalid meeting name')
    await expect(deleteMeeting('')).rejects.toThrow('Invalid meeting name')
  })

  it('should delete meeting with frontmatter', async () => {
    const content = `---
date: 2026-08-21 10:00
timezone: Europe/Berlin
topic: Sprint Planning
attendees: [Alice, Bob]
---
# Sprint Planning

Notes here`

    await writeMeeting('Sprint Planning', content)

    let result = await readMeeting('Sprint Planning')
    expect(result).toBe(content)

    await deleteMeeting('Sprint Planning')

    result = await readMeeting('Sprint Planning')
    expect(result).toBeNull()
  })

  it('should delete meeting with special characters', async () => {
    await writeMeeting('Café Meeting', '# Café discussion')

    await deleteMeeting('Café Meeting')

    const content = await readMeeting('Café Meeting')
    expect(content).toBeNull()
  })

  it('should only delete specified meeting', async () => {
    await writeMeeting('Meeting A', '# A')
    await writeMeeting('Meeting B', '# B')
    await writeMeeting('Meeting C', '# C')

    await deleteMeeting('Meeting B')

    const meetings = await listMeetings()
    expect(meetings).toContain('Meeting A')
    expect(meetings).not.toContain('Meeting B')
    expect(meetings).toContain('Meeting C')
  })

  it('should handle multiple deletions', async () => {
    await writeMeeting('First', '# First')
    await writeMeeting('Second', '# Second')
    await writeMeeting('Third', '# Third')

    await deleteMeeting('First')
    await deleteMeeting('Second')
    await deleteMeeting('Third')

    const meetings = await listMeetings()
    expect(meetings).toEqual([])
  })
})
