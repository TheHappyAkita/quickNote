import type { Reminder } from '#shared/types/notes'

const REMINDER_PATTERN = /^(.*?)(remind|remindme|reminder)(?:\s*:\s*|\s+)(.+)$/i

export default defineEventHandler(async (): Promise<Reminder[]> => {
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
        const text = match[3]!.trim().slice(0, 200) // Limit text length
        reminders.push({ date, text, keyword })
      }
    }
  }

  // Sort by date descending (newest first)
  return reminders.sort((a, b) => b.date.localeCompare(a.date))
})
