// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { getValidatedRouterParam, validateDateFormat } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const date = getValidatedRouterParam(event, 'date')
  
  if (!validateDateFormat(date)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid date format. Expected YYYY-MM-DD format.'
    })
  }

  const content = await readNote(date)
  return { date, content: content ?? '' }
})
