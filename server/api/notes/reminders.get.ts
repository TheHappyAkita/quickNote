import type { Reminder } from '#shared/types/notes'
import { join } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { getNotesDir } from '../../utils/notes'

const REMINDER_PATTERN = /^(.*?)(remind|remindme|reminder)(?:\s*:\s*|\s+)(.+)$/i
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

export default defineEventHandler(async (): Promise<Reminder[]> => {
  const dismissed = await loadDismissed()
  const dates = await listNotes()
  const reminders: Reminder[] = []

  for (const date of dates) {
    const content = await readNote(date)
    if (!content) continue

    const lines = content.split('\n')
    for (const line of lines) {
      const match = REMINDER_PATTERN.exec(line.trim())
      if (match) {
        const keywordRaw = match[2]!.toLowerCase()
        const keyword = keywordRaw === 'remindme' ? 'remindme' : keywordRaw as 'remind' | 'reminder'
        const text = match[3]!.trim().slice(0, 200)
        const key: DismissedKey = `${date}:${text}`
        if (!dismissed.has(key)) {
          reminders.push({ date, text, keyword })
        }
      }
    }
  }

  return reminders.sort((a, b) => b.date.localeCompare(a.date))
})
