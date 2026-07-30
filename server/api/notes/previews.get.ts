// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { generatePreview } from '../../utils/content-processor'

export default defineEventHandler(async () => {
  const dates = await listNotes()
  const result: Record<string, string> = {}
  await Promise.all(dates.map(async (date) => {
    const content = await readNote(date)
    result[date] = generatePreview(content ?? '')
  }))
  return result
})
