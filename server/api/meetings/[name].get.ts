// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { readMeeting, listMeetingsWithMeta } from '../../utils/meetings'
import { toSlug } from '#shared/utils/location'

export default defineEventHandler(async (event) => {
  const raw: string = decodeURIComponent(getRouterParam(event, 'name') ?? '')
  const slug: string = toSlug(raw)
  const all = await listMeetingsWithMeta()
  const match = all.find(m => m.slug === slug || m.slug === raw || m.name === raw)
  const resolvedSlug: string = match?.slug ?? slug
  const content: string | null = await readMeeting(resolvedSlug)
  if (!content) throw createError({ statusCode: 404, statusMessage: 'Meeting not found' })
  return { name: raw, slug: resolvedSlug, content }
})
