import type { LocationMeta } from '#shared/types/notes'
import {
  listNotes, readNote, listPages, readPage,
  listLocationsWithMeta, extractLocationMentionsWithCoords,
} from '../../utils/notes'

export default defineEventHandler(async (): Promise<LocationMeta[]> => {
  const [dates, pages, storedLocations] = await Promise.all([
    listNotes(),
    listPages(),
    listLocationsWithMeta(),
  ])

  // Map location name → stored meta
  const locationMap = new Map<string, LocationMeta>(
    storedLocations.map(l => [l.name, { ...l, mentionedInDates: [] }]),
  )

  // Inline coord fallback: first inline coord found for a location with no stored coords
  const inlineCoordFallback = new Map<string, { lat: number; lng: number }>()

  const processContent = (content: string, date?: string) => {
    const mentions = extractLocationMentionsWithCoords(content)
    for (const { name, lat, lng } of mentions) {
      if (!locationMap.has(name)) {
        locationMap.set(name, { name, tags: [], mentionedInDates: [] })
      }
      const entry = locationMap.get(name)!
      if (date) {
        entry.mentionedInDates = entry.mentionedInDates ?? []
        if (!entry.mentionedInDates.includes(date)) {
          entry.mentionedInDates.push(date)
        }
      }
      if (lat != null && lng != null && entry.lat == null && !inlineCoordFallback.has(name)) {
        inlineCoordFallback.set(name, { lat, lng })
      }
    }
  }

  // Read all daily notes in parallel batches
  await Promise.all(dates.map(async (date) => {
    const content = await readNote(date)
    if (content) processContent(content, date)
  }))

  // Read all pages (they contribute mentions but no date)
  await Promise.all(pages.map(async (page) => {
    const content = await readPage(page)
    if (content) processContent(content, undefined)
  }))

  // Apply inline coord fallback where no stored coords exist
  for (const [name, coords] of inlineCoordFallback) {
    const entry = locationMap.get(name)!
    if (entry.lat == null) {
      entry.lat = coords.lat
      entry.lng = coords.lng
    }
  }

  // Sort mention dates
  for (const entry of locationMap.values()) {
    entry.mentionedInDates?.sort()
  }

  return [...locationMap.values()].sort((a, b) => a.name.localeCompare(b.name))
})
