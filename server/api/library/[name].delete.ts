// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { deleteLibrary } from '../../utils/library'
import { toSlug } from '#shared/utils/location'
import { cacheInvalidate } from '../../utils/cache'

export default defineEventHandler(async (event) => {
  const name = decodeURIComponent(getRouterParam(event, 'name') ?? '')
  if (!name) throw createError({ statusCode: 400, message: 'Name required' })
  const slug = toSlug(name)
  await deleteLibrary(slug)
  cacheInvalidate('graph')
  return { success: true }
})
