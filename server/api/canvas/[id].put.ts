// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import type { CanvasState } from '#shared/types/notes'
import { loadCanvasList, saveCanvas } from '../../utils/canvas'
import { getValidatedRouterParam } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const id = getValidatedRouterParam(event, 'id')
  
  // Verify canvas exists before saving
  const list = await loadCanvasList()
  const exists = list.some(c => c.id === id)
  if (!exists) {
    throw createError({ statusCode: 404, statusMessage: 'Canvas not found' })
  }
  
  const body = await readBody<CanvasState>(event)
  
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid canvas state' })
  }
  
  if (!Array.isArray(body.cards) || !Array.isArray(body.edges)) {
    throw createError({ statusCode: 400, statusMessage: 'Canvas state must include cards and edges arrays' })
  }
  
  await saveCanvas(id, body)
  return { ok: true }
})
