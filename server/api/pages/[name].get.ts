// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { readPage, listPagesWithMeta } from '../../utils/notes'
import { toSlug } from '#shared/utils/location'

export default defineEventHandler(async (event) => {
  const raw = decodeURIComponent(getRouterParam(event, 'name') ?? '')
  if (!raw) throw createError({ statusCode: 400, statusMessage: 'Invalid page name' })
  const slug = toSlug(raw)
  let content = await readPage(slug)
  let resolvedSlug = slug
  if (content === null && raw !== slug) {
    // raw might be an old unsanitized filename or a display name
    const all = await listPagesWithMeta()
    const match = all.find(p => p.name === raw || p.slug === raw)
    if (match) { resolvedSlug = match.slug; content = await readPage(match.slug) }
  }
  if (content === null) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  }
  return { name: raw, slug: resolvedSlug, content }
})
