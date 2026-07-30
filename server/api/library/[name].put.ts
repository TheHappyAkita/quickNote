// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { writeLibrary, renameLibraryFile } from '../../utils/library'
import { isValidPageName } from '../../utils/notes'
import { toSlug, parseFrontmatterName } from '#shared/utils/location'
import { injectFrontmatterIfNeeded } from '../../utils/content-processor'
import { getValidatedRouterParam, validateContentLength } from '../../utils/validation'
import { cacheInvalidate } from '../../utils/cache'

export default defineEventHandler(async (event) => {
  const raw = decodeURIComponent(getValidatedRouterParam(event, 'name'))
  const slug = toSlug(raw)
  if (!slug || !isValidPageName(slug)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid library name' })
  }
  // Migrate old file if slug changed
  if (raw !== slug) await renameLibraryFile(raw, slug)

  const body = await readBody<{ content: string }>(event)
  if (typeof body.content !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Content is required' })
  }

  validateContentLength(body.content)

  // Inject name: frontmatter if the display name differs from slug
  const existingName = parseFrontmatterName(body.content)
  const content = existingName ? body.content : injectFrontmatterIfNeeded(body.content, raw, slug)

  await writeLibrary(slug, content)
  cacheInvalidate('graph')
  return { success: true, slug, name: existingName ?? raw }
})
