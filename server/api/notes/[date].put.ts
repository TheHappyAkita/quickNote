// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { deleteNote } from '../../utils/notes'
import { removeNoteCardFromAllCanvases } from '../../utils/canvas'
import { cacheInvalidate } from '../../utils/cache'
import { getValidatedRouterParam, validateDateFormat, validateContentLength } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const date = getValidatedRouterParam(event, 'date')
  
  if (!validateDateFormat(date)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid date format. Expected YYYY-MM-DD format.'
    })
  }

  const body = await readBody<{ content: string }>(event)
  if (typeof body?.content !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Content field is required and must be a string.'
    })
  }

  validateContentLength(body.content)

  if (!body.content.trim()) {
    await deleteNote(date)
    await removeNoteCardFromAllCanvases(date)
    cacheInvalidate('graph', 'reminders')
    return { ok: true, deleted: true }
  }

  await writeNote(date, body.content)
  cacheInvalidate('graph', 'reminders')
  return { ok: true, deleted: false }
})
