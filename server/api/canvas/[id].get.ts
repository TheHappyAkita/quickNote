// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { loadCanvas, loadCanvasList } from '../../utils/canvas'
import { getValidatedRouterParam } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const id = getValidatedRouterParam(event, 'id')
  
  // Verify canvas exists in the list
  const list = await loadCanvasList()
  const exists = list.some(c => c.id === id)
  if (!exists) {
    throw createError({ statusCode: 404, statusMessage: 'Canvas not found' })
  }
  
  return loadCanvas(id)
})
