// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { loadCanvasList, renameCanvas } from '../../utils/canvas'
import { getValidatedRouterParam, validateName } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const id = getValidatedRouterParam(event, 'id')
  
  // Verify canvas exists before renaming
  const list = await loadCanvasList()
  const exists = list.some(c => c.id === id)
  if (!exists) {
    throw createError({ statusCode: 404, statusMessage: 'Canvas not found' })
  }
  
  const body = await readBody<{ name: string }>(event)
  const trimmedName = body?.name?.trim()
  
  if (!trimmedName) {
    throw createError({ statusCode: 400, statusMessage: 'Name is required' })
  }
  
  validateName(trimmedName)
  
  return renameCanvas(id, trimmedName)
})
