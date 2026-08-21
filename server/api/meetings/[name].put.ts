// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { writeMeeting, isValidMeetingName, renameMeetingFile } from '../../utils/meetings'
import { toSlug, parseFrontmatterName, injectFrontmatterName } from '#shared/utils/location'

export default defineEventHandler(async (event) => {
  const raw: string = decodeURIComponent(getRouterParam(event, 'name') ?? '')
  const slug: string = toSlug(raw)
  if (!slug || !isValidMeetingName(slug)) throw createError({ statusCode: 400, statusMessage: 'Invalid meeting name' })
  if (raw !== slug) await renameMeetingFile(raw, slug)
  const body = await readBody<{ content: string }>(event)
  if (typeof body.content !== 'string') throw createError({ statusCode: 400, statusMessage: 'Content is required' })
  const existingName: string | null = parseFrontmatterName(body.content)
  const content: string = existingName || raw === slug ? body.content : injectFrontmatterName(body.content, raw)
  await writeMeeting(slug, content)
  return { success: true, slug, name: existingName ?? raw }
})
