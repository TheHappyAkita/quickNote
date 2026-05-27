// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

export default defineEventHandler(async () => {
  const dates = await listNotes()
  const result: Record<string, string> = {}
  await Promise.all(dates.map(async (date) => {
    const content = await readNote(date)
    result[date] = content
      ?.replace(/#{1,6}\s+/g, '')
      .replace(/\[\[[\d-]+\]\]/g, '')
      .replace(/[*_`~>#\-\[\]]/g, '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .join(' ')
      .slice(0, 160) ?? ''
  }))
  return result
})
