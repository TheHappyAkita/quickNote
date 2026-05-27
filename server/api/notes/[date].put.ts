// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { deleteNote } from '../../utils/notes'
import { removeNoteCardFromAllCanvases } from '../../utils/canvas'
import { cacheInvalidate } from '../../utils/cache'

export default defineEventHandler(async (event) => {
  const date = getRouterParam(event, 'date')
  if (!date) {
    throw createError({ statusCode: 400, message: 'Date parameter required' })
  }

  const body = await readBody<{ content: string }>(event)
  if (typeof body?.content !== 'string') {
    throw createError({ statusCode: 400, message: 'Content field required' })
  }

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
