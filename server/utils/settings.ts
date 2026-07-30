// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { getNotesDir, ensureNotesDir } from './notes'
import type { AppSettings, OllamaSettings } from '#shared/types/notes'

const SETTINGS_FILE = 'settings.json'

function getDefaultSettings(): AppSettings {
  const config = useRuntimeConfig()
  return {
    ollama: {
      url: config.ollamaBaseUrl || 'http://localhost:11434',
      model: '',
    },
  }
}

export async function getSettings(): Promise<AppSettings> {
  await ensureNotesDir()
  const filePath = join(getNotesDir(), SETTINGS_FILE)
  const defaultSettings = getDefaultSettings()
  if (!existsSync(filePath)) {
    return defaultSettings
  }
  try {
    const raw = await readFile(filePath, 'utf-8')
    return { ...defaultSettings, ...JSON.parse(raw) }
  } catch {
    return defaultSettings
  }
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  const current = await getSettings()
  const updated = { ...current, ...settings }
  await ensureNotesDir()
  const filePath = join(getNotesDir(), SETTINGS_FILE)
  await writeFile(filePath, JSON.stringify(updated, null, 2), 'utf-8')
}

export async function getOllamaSettings(): Promise<OllamaSettings> {
  const settings = await getSettings()
  return settings.ollama
}
