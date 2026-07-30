// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { deleteLibrary } from '../../utils/library'
import { toSlug } from '#shared/utils/location'
import { getValidatedRouterParam } from '../../utils/validation'
import { cacheInvalidate } from '../../utils/cache'

export default defineEventHandler(async (event) => {
  const name = decodeURIComponent(getValidatedRouterParam(event, 'name'))
  const slug = toSlug(name)
  await deleteLibrary(slug)
  cacheInvalidate('graph')
  return { success: true }
})
