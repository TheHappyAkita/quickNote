// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { writeLocation, deleteLocation, isValidLocationName, renameLocationFile } from '../../utils/notes'
import { sanitizeLocationSlug, parseFrontmatterName, injectFrontmatterName, decodeCoordSlug } from '#shared/utils/location'
import { cacheInvalidate } from '../../utils/cache'

export default defineEventHandler(async (event) => {
  const raw = decodeURIComponent(getRouterParam(event, 'name') ?? '')
  const slug = sanitizeLocationSlug(raw)
  if (!slug || !isValidLocationName(slug)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid location name' })
  }
  // Migrate old file if slug changed
  if (raw !== slug) await renameLocationFile(raw, slug)
  const body = await readBody<{ content: string }>(event)
  if (typeof body?.content !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Content field required' })
  }
  if (!body.content.trim()) {
    await deleteLocation(slug)
    cacheInvalidate('graph')
    return { ok: true, deleted: true }
  }
  // For named (non-coord) locations: inject name: frontmatter if display name differs from slug
  let content = body.content
  const isCoordSlug = decodeCoordSlug(slug) !== null
  if (!isCoordSlug) {
    const existingName = parseFrontmatterName(content)
    if (!existingName && raw !== slug) {
      content = injectFrontmatterName(content, raw)
    }
  }
  await writeLocation(slug, content)
  cacheInvalidate('graph')
  return { ok: true, deleted: false, slug }
})
