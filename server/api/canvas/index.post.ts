// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { createCanvas } from '../../utils/canvas'
import { validateName } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name: string }>(event)
  const trimmedName = body?.name?.trim()
  
  if (!trimmedName) {
    throw createError({ statusCode: 400, statusMessage: 'Name is required' })
  }
  
  validateName(trimmedName)
  
  return createCanvas(trimmedName)
})
