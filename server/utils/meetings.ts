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
  listWithMeta: listMeetingsWithMeta,
  rename: renameMeetingFile,
} = meetingsNamespace
