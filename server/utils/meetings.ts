// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import type { MeetingMeta } from '#shared/types/notes'
import { createContentNamespace, type ContentNamespace } from './content-namespace'

const MEETING_NAME_PATTERN = /^[a-zA-Z0-9_\-\. äöüÄÖÜáéíóúàèìòùâêîôûãõ]+$/

export function isValidMeetingName(name: string): boolean {
  return MEETING_NAME_PATTERN.test(name) && name.length > 0 && name.length <= 100
}

const meetingsNamespace: ContentNamespace<MeetingMeta> = createContentNamespace({
  dirName: 'meetings',
  type: 'meeting',
  maxNameLength: 100,
  namePattern: MEETING_NAME_PATTERN,
})

export const {
  list: listMeetings,
  read: readMeeting,
  write: writeMeeting,
  delete: deleteMeeting,
  rename: renameMeetingFile,
} = meetingsNamespace

export async function listMeetingsWithMeta(): Promise<MeetingMeta[]> {
  const meetings: MeetingMeta[] = await meetingsNamespace.listWithMeta()
  const meetingsWithDates: MeetingMeta[] = await Promise.all(meetings.map(async (meeting: MeetingMeta): Promise<MeetingMeta> => {
    const content: string | null = await readMeeting(meeting.slug)
    const date: string | undefined = content?.match(/^date:\s*(.+)$/m)?.[1]?.trim()
    return date ? { ...meeting, date } : meeting
  }))

  return meetingsWithDates.sort((first: MeetingMeta, second: MeetingMeta): number => {
    if (first.date && second.date) return second.date.localeCompare(first.date) || first.name.localeCompare(second.name)
    if (first.date) return -1
    if (second.date) return 1
    return first.name.localeCompare(second.name)
  })
}
