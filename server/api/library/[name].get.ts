// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { readLibrary, listLibraryWithMeta } from '../../utils/library'
import { resolveEntitySlug } from '../../utils/entity-resolver'
import { getValidatedRouterParam } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const raw = decodeURIComponent(getValidatedRouterParam(event, 'name'))
  
  const slug = await resolveEntitySlug(raw, listLibraryWithMeta, readLibrary)
  if (!slug) {
    throw createError({ statusCode: 404, statusMessage: 'Library entry not found' })
  }
  
  const content = await readLibrary(slug)
  if (!content) {
    throw createError({ statusCode: 404, statusMessage: 'Library entry not found' })
  }
  
  return { name: raw, slug, content }
})
