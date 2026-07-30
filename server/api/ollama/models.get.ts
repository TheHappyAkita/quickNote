// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { getOllamaSettings } from '../../utils/settings'

export default defineEventHandler(async () => {
  const { url } = await getOllamaSettings()
  if (!url) {
    return []
  }

  try {
    const response = await $fetch<{ models: { name: string }[] }>(`${url}/api/tags`, {
      timeout: 5000,
    })
    return response.models.map((m) => m.name)
  } catch (err) {
    console.error('Failed to fetch Ollama models:', err)
    return []
  }
})
