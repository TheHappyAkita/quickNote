// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { readPerson, listPersonsWithMeta } from '../../utils/notes'
import { toSlug } from '#shared/utils/location'

export default defineEventHandler(async (event) => {
  const raw = decodeURIComponent(getRouterParam(event, 'name') ?? '')
  if (!raw) throw createError({ statusCode: 400, statusMessage: 'Invalid person name' })
  // Try slug directly first, then fall back to matching display name
  const slug = toSlug(raw)
  let content = await readPerson(slug)
  let resolvedSlug = slug
  if (content === null && raw !== slug) {
    // raw might itself be a valid old slug (e.g. 'Deer, John')
    const all = await listPersonsWithMeta()
    const match = all.find(p => p.name === raw || p.slug === raw)
    if (match) { resolvedSlug = match.slug; content = await readPerson(match.slug) }
  }
  return { name: raw, slug: resolvedSlug, content: content ?? '' }
})
