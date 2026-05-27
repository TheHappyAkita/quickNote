// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { join } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { getNotesDir } from '../../../utils/notes'
import { cacheInvalidate } from '../../../utils/cache'

const DISMISSED_FILE = '.dismissed_reminders.json'

type DismissedKey = `${string}:${string}`

async function loadDismissed(): Promise<DismissedKey[]> {
  try {
    const raw = await readFile(join(getNotesDir(), DISMISSED_FILE), 'utf-8')
    return JSON.parse(raw) as DismissedKey[]
  } catch {
    return []
  }
}

async function saveDismissed(list: DismissedKey[]): Promise<void> {
  await writeFile(join(getNotesDir(), DISMISSED_FILE), JSON.stringify(list, null, 2), 'utf-8')
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ date: string; text: string }>(event)
  if (!body?.date || !body?.text) {
    throw createError({ statusCode: 400, message: 'date and text required' })
  }

  const key: DismissedKey = `${body.date}:${body.text}`
  const dismissed = await loadDismissed()

  if (!dismissed.includes(key)) {
    dismissed.push(key)
    await saveDismissed(dismissed)
  }

  cacheInvalidate('reminders')
  return { ok: true }
})
