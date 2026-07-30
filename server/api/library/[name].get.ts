// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { readLibrary, listLibraryWithMeta } from '../../utils/library'
import { toSlug } from '#shared/utils/location'

export default defineEventHandler(async (event) => {
  const raw = decodeURIComponent(getRouterParam(event, 'name') ?? '')
  if (!raw) throw createError({ statusCode: 400, statusMessage: 'Invalid library name' })
  const slug = toSlug(raw)
  let content = await readLibrary(slug)
  let resolvedSlug = slug
  if (content === null && raw !== slug) {
    const all = await listLibraryWithMeta()
    const match = all.find(p => p.name === raw || p.slug === raw)
    if (match) { resolvedSlug = match.slug; content = await readLibrary(match.slug) }
  }
  if (content === null) {
    throw createError({ statusCode: 404, statusMessage: 'Library entry not found' })
  }
  return { name: raw, slug: resolvedSlug, content }
})
