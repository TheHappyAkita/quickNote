// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { writeMeeting } from '../../../../server/utils/meetings'

describe('Meetings API - GET /api/meetings', () => {
  let testDir: string

  beforeEach(async () => {
    testDir = join(tmpdir(), `quicknote-meetings-api-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
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

  it('should return empty array when no meetings exist', async () => {
    const { listMeetingsWithMeta } = await import('../../../../server/utils/meetings')
    const result = await listMeetingsWithMeta()
    expect(result).toEqual([])
  })

  it('should return list of meetings with metadata', async () => {
    await writeMeeting('Q3 Planning', '# Q3 Planning\n\n#planning #quarterly')
    await writeMeeting('Team Sync', '---\nname: Weekly Team Sync\n---\n# Team Sync\n\n#weekly #team')

    const { listMeetingsWithMeta } = await import('../../../../server/utils/meetings')
    const result = await listMeetingsWithMeta()

    expect(result).toHaveLength(2)
    
    const q3 = result.find(m => m.slug === 'Q3 Planning')
    expect(q3).toMatchObject({
      name: 'Q3 Planning',
      slug: 'Q3 Planning',
      tags: expect.arrayContaining(['planning', 'quarterly']),
    })

    const sync = result.find(m => m.slug === 'Team Sync')
    expect(sync).toMatchObject({
      name: 'Weekly Team Sync',
      slug: 'Team Sync',
      tags: expect.arrayContaining(['weekly', 'team']),
    })
  })

  it('should extract tags from meeting content', async () => {
    await writeMeeting('Tagged Meeting', '# Meeting\n\nDiscussion points #important #urgent\n\nAction items #followup')

    const { listMeetingsWithMeta } = await import('../../../../server/utils/meetings')
    const result = await listMeetingsWithMeta()

    expect(result).toHaveLength(1)
    expect(result[0].tags).toEqual(expect.arrayContaining(['important', 'urgent', 'followup']))
  })

  it('should list meetings with the newest meeting date first', async () => {
    await writeMeeting('Older Meeting', '---\ndate: 2026-08-20 09:00\n---\nOlder')
    await writeMeeting('Undated Meeting', 'Undated')
    await writeMeeting('Newest Meeting', '---\ndate: 2026-08-22 09:00\n---\nNewest')

    const { listMeetingsWithMeta } = await import('../../../../server/utils/meetings')
    const result = await listMeetingsWithMeta()

    expect(result.map((meeting) => meeting.name)).toEqual(['Newest Meeting', 'Older Meeting', 'Undated Meeting'])
    expect(result[0]?.date).toBe('2026-08-22 09:00')
  })

  it('should handle meetings with frontmatter metadata', async () => {
    const content = `---
name: Sprint Planning Meeting
date: 2026-08-21 10:00
timezone: Europe/Berlin
topic: Sprint 42 Planning
attendees: [Alice, Bob, Charlie]
---
# Sprint Planning

## Agenda
1. Review backlog
2. Estimate stories

#sprint #planning`

    await writeMeeting('Sprint Planning', content)

    const { listMeetingsWithMeta } = await import('../../../../server/utils/meetings')
    const result = await listMeetingsWithMeta()

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      name: 'Sprint Planning Meeting',
      slug: 'Sprint Planning',
      tags: expect.arrayContaining(['sprint', 'planning']),
    })
  })
})
