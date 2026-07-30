// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { listPages, readPage } from '../../utils/pages'
import { generatePreview } from '../../utils/content-processor'

export default defineEventHandler(async () => {
  const pages = await listPages()
  const result: Record<string, string> = {}
  await Promise.all(pages.map(async (page) => {
    const content = await readPage(page)
    result[page] = generatePreview(content ?? '')
  }))
  return result
})
