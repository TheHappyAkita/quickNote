// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { saveSettings } from '../../utils/settings'
import type { OllamaSettings } from '#shared/types/notes'

export default defineEventHandler(async (event) => {
  const body = await readBody<OllamaSettings>(event)
  if (!body.url) {
    throw createError({ statusCode: 400, statusMessage: 'URL is required' })
  }
  await saveSettings({ ollama: body })
  return { success: true }
})
