import type { Reminder } from '#shared/types/notes'
import { join } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { getNotesDir } from '../../utils/notes'

const REMINDER_PATTERN = /^(.*?)(remind|remindme|reminder)(?:\s*:\s*|\s+)(.+)$/i
const ALERT_PATTERN = /^(.*?)(alert)\s+(\d{4}-\d{2}-\d{2})\s*:\s*(.+)$/i
const DISMISSED_FILE = '.dismissed_reminders.json'

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
  const dismissed = await loadDismissed()
  const dates = await listNotes()
  const reminders: Reminder[] = []

  for (const noteDate of dates) {
    const content = await readNote(noteDate)
    if (!content) continue

    const lines = content.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()

      // Check for Alert pattern first (Alert YYYY-MM-DD: text)
      const alertMatch = ALERT_PATTERN.exec(trimmed)
      if (alertMatch) {
        const alertDate = alertMatch[3]!
        const text = alertMatch[4]!.trim().slice(0, 200)
        const key: DismissedKey = `${noteDate}:${text}`
        // Only show alert if the alert date is today or in the past
        if (!dismissed.has(key) && isAlertDue(alertDate)) {
          reminders.push({ date: noteDate, text, keyword: 'alert', alertDate })
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
      }
    }
  }

  // Sort: alerts first (by alert date), then reminders by note date
  return reminders.sort((a, b) => {
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
})
