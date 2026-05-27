// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { writePerson, deletePerson, isValidPersonName, renamePersonFile } from '../../utils/notes'
import { toSlug, parseFrontmatterName, injectFrontmatterName } from '#shared/utils/location'
import { cacheInvalidate } from '../../utils/cache'

export default defineEventHandler(async (event) => {
  const raw = decodeURIComponent(getRouterParam(event, 'name') ?? '')
  const slug = toSlug(raw)
  if (!slug || !isValidPersonName(slug)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid person name' })
  }
  // Migrate old file if slug changed
  if (raw !== slug) await renamePersonFile(raw, slug)
  const body = await readBody<{ content: string }>(event)
  if (typeof body?.content !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Content field required' })
  }
  if (!body.content.trim()) {
    await deletePerson(slug)
    cacheInvalidate('graph')
    return { ok: true, deleted: true }
  }
  // Inject name: frontmatter if the display name differs from slug
  let content = body.content
  const existingName = parseFrontmatterName(content)
  if (!existingName && raw !== slug) {
    content = injectFrontmatterName(content, raw)
  }
  await writePerson(slug, content)
  cacheInvalidate('graph')
  return { ok: true, deleted: false, slug, name: existingName ?? raw }
})
