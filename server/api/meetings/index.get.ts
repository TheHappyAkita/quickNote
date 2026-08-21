// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import type { MeetingMeta } from '#shared/types/notes'
import { listMeetingsWithMeta } from '../../utils/meetings'

export default defineEventHandler(async (): Promise<MeetingMeta[]> => listMeetingsWithMeta())
