// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import type { Reminder } from '#shared/types/notes'
import { join } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { getNotesDir, listNotes, readNote } from '../../utils/notes'
import { cacheGet, cacheSet, CACHE_TTL } from '../../utils/cache'

const REMINDER_PATTERN = /^(.*?)(remind|remindme|reminder)(?:\s*:\s*|\s+)(.+)$/i
const ALERT_PATTERN = /^(.*?)(alert|alertme|alerter|alerta)\s+(\S+)\s*:\s*(.+)$/i
const TODO_PATTERN = /^(.*?)(todo|to-do|to do)(?:\s*:\s*|\s+)(.+)$/i
const DISMISSED_FILE = '.dismissed_reminders.json'

// Parse various date formats and return YYYY-MM-DD or null
function parseDateFormat(dateStr: string): string | null {
  const trimmed = dateStr.trim()

  // ISO: 2026-12-31 or 2026.12.31
  const isoMatch = trimmed.match(/^(\d{4})[-\.](\d{1,2})[-\.](\d{1,2})$/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    return `${year}-${month!.padStart(2, '0')}-${day!.padStart(2, '0')}`
  }

  // European: 31.12.2026 or 31-12-2026
  const euMatch = trimmed.match(/^(\d{1,2})[-\.](\d{1,2})[-\.](\d{4})$/)
  if (euMatch) {
    const [, day, month, year] = euMatch
    return `${year}-${month!.padStart(2, '0')}-${day!.padStart(2, '0')}`
  }

  // US: 12/31/2026
  const usMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (usMatch) {
    const [, month, day, year] = usMatch
    return `${year}-${month!.padStart(2, '0')}-${day!.padStart(2, '0')}`
  }

  // With spaces: 31 Dec 2026, 31 December 2026
  const wordMatch = trimmed.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/)
  if (wordMatch) {
    const [, day, monthName, year] = wordMatch
    const monthNum = parseMonth(monthName!.toLowerCase())
    if (monthNum) {
      return `${year}-${monthNum}-${day!.padStart(2, '0')}`
    }
  }

  return null
}

function parseMonth(name: string): string | null {
  const months: Record<string, string> = {
    jan: '01', january: '01',
    feb: '02', february: '02',
    mar: '03', march: '03',
    apr: '04', april: '04',
    may: '05',
    jun: '06', june: '06',
    jul: '07', july: '07',
    aug: '08', august: '08',
    sep: '09', september: '09',
    oct: '10', october: '10',
    nov: '11', november: '11',
    dec: '12', december: '12',
  }
  return months[name] || null
}

type DismissedKey = `${string}:${string}` // date:text

async function loadDismissed(): Promise<Set<DismissedKey>> {
  try {
    const raw = await readFile(join(getNotesDir(), DISMISSED_FILE), 'utf-8')
    const arr: DismissedKey[] = JSON.parse(raw)
    return new Set(arr)
  } catch {
    return new Set()
  }
}

function getToday(): string {
  return new Date().toISOString().split('T')[0]!
}

function isAlertDue(alertDate: string): boolean {
  return alertDate <= getToday()
}

export default defineEventHandler(async (): Promise<Reminder[]> => {
  const cached = cacheGet<Reminder[]>('reminders')
  if (cached) return cached

  const [dismissed, dates] = await Promise.all([loadDismissed(), listNotes()])

  // Read all note files in parallel batches
  const BATCH = 50
  const allContents: Array<string | null> = []
  for (let i = 0; i < dates.length; i += BATCH) {
    const batch = await Promise.all(dates.slice(i, i + BATCH).map(d => readNote(d)))
    allContents.push(...batch)
  }

  const reminders: Reminder[] = []

  for (let idx = 0; idx < dates.length; idx++) {
    const noteDate = dates[idx]!
    const content = allContents[idx]
    if (!content) continue

    const lines = content.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()

      // Check for Alert pattern first (Alert YYYY-MM-DD: text)
      const alertMatch = ALERT_PATTERN.exec(trimmed)
      if (alertMatch) {
        const rawDate = alertMatch[3]!
        const alertDate = parseDateFormat(rawDate)
        if (alertDate) {
          const text = alertMatch[4]!.trim().slice(0, 200)
          const key: DismissedKey = `${noteDate}:${text}`
          // Only show alert if the alert date is today or in the past
          if (!dismissed.has(key) && isAlertDue(alertDate)) {
            reminders.push({ date: noteDate, text, keyword: 'alert', alertDate })
          }
        }
        continue
      }

      // Check for regular reminder patterns
      const match = REMINDER_PATTERN.exec(trimmed)
      if (match) {
        const keywordRaw = match[2]!.toLowerCase()
        const keyword = keywordRaw === 'remindme' ? 'remindme' : keywordRaw as 'remind' | 'reminder'
        const text = match[3]!.trim().slice(0, 200)
        const key: DismissedKey = `${noteDate}:${text}`
        if (!dismissed.has(key)) {
          reminders.push({ date: noteDate, text, keyword })
        }
        continue
      }

      // Check for ToDo pattern
      const todoMatch = TODO_PATTERN.exec(trimmed)
      if (todoMatch) {
        const text = todoMatch[3]!.trim().slice(0, 200)
        const key: DismissedKey = `${noteDate}:${text}`
        if (!dismissed.has(key)) {
          reminders.push({ date: noteDate, text, keyword: 'todo' })
        }
      }
    }
  }

  // Sort: alerts first (by alert date), then reminders by note date
  const result = reminders.sort((a, b) => {
    // Alerts come before regular reminders
    if (a.keyword === 'alert' && b.keyword !== 'alert') return -1
    if (a.keyword !== 'alert' && b.keyword === 'alert') return 1
    // Both alerts: sort by alert date
    if (a.keyword === 'alert' && b.keyword === 'alert') {
      return (a.alertDate || a.date).localeCompare(b.alertDate || b.date)
    }
    // Both regular: sort by note date desc
    return b.date.localeCompare(a.date)
  })
  cacheSet('reminders', result, CACHE_TTL.REMINDERS)
  return result
})
