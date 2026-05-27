// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { deletePage, renamePageFile, listPagesWithMeta } from '../../utils/notes'
import { toSlug } from '#shared/utils/location'
import { cacheInvalidate } from '../../utils/cache'

export default defineEventHandler(async (event) => {
  const raw = decodeURIComponent(getRouterParam(event, 'name') ?? '')
  if (!raw) throw createError({ statusCode: 400, statusMessage: 'Invalid page name' })
  let slug = toSlug(raw)
  // Resolve via display name or direct slug match
  const all = await listPagesWithMeta()
  const match = all.find(p => p.slug === raw || p.slug === slug || p.name === raw)
  if (!match) throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  slug = match.slug
  // Migrate old file if needed
  if (raw !== slug) await renamePageFile(raw, slug)
  await deletePage(slug)
  cacheInvalidate('graph')
  return { success: true, slug }
})
