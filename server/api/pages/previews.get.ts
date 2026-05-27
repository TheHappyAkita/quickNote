// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { listPages, readPage } from '../../utils/notes'

export default defineEventHandler(async () => {
  const pages = await listPages()
  const result: Record<string, string> = {}
  await Promise.all(pages.map(async (page) => {
    const content = await readPage(page)
    result[page] = content
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
