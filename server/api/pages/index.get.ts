// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import type { NotePageMeta } from '#shared/types/notes'
import { listPagesWithMeta } from '../../utils/pages'

export default defineEventHandler(async (): Promise<NotePageMeta[]> => {
  return await listPagesWithMeta()
})
