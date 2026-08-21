// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { deleteMeeting, listMeetingsWithMeta } from '../../utils/meetings'
import { toSlug } from '#shared/utils/location'

export default defineEventHandler(async (event) => {
  const raw: string = decodeURIComponent(getRouterParam(event, 'name') ?? '')
  const match = (await listMeetingsWithMeta()).find(m => m.slug === raw || m.slug === toSlug(raw) || m.name === raw)
  if (!match) throw createError({ statusCode: 404, statusMessage: 'Meeting not found' })
  await deleteMeeting(match.slug)
  return { success: true, slug: match.slug }
})
