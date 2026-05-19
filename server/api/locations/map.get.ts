import type { LocationMeta } from '#shared/types/notes'
import {
  listNotes, readNote, listPagesWithMeta, readPage,
  listPersonsWithMeta, readPerson,
  listLocationsWithMeta, extractLocationMentionsWithCoords,
} from '../../utils/notes'

export default defineEventHandler(async (): Promise<LocationMeta[]> => {
  const [dates, pagesMeta, personsMeta, storedLocations] = await Promise.all([
    listNotes(),
    listPagesWithMeta(),
    listPersonsWithMeta(),
    listLocationsWithMeta(),
  ])

  // Map location name → stored meta
  const locationMap = new Map<string, LocationMeta>(
    storedLocations.map(l => [l.name, { ...l, mentionedInDates: [], mentionedInPages: [], mentionedInPeople: [] }]),
  )

  // Inline coord fallback: first inline coord found for a location with no stored coords
  const inlineCoordFallback = new Map<string, { lat: number; lng: number }>()

  function ensureEntry(name: string) {
    if (!locationMap.has(name)) {
      locationMap.set(name, { name, slug: name, tags: [], mentionedInDates: [], mentionedInPages: [], mentionedInPeople: [] })
    }
    return locationMap.get(name)!
  }

  const processContent = (content: string, date?: string, page?: string, person?: string) => {
    const mentions = extractLocationMentionsWithCoords(content)
    for (const { name, lat, lng } of mentions) {
      const entry = ensureEntry(name)
      if (date) {
        entry.mentionedInDates = entry.mentionedInDates ?? []
        if (!entry.mentionedInDates.includes(date)) entry.mentionedInDates.push(date)
      }
      if (page) {
        entry.mentionedInPages = entry.mentionedInPages ?? []
        if (!entry.mentionedInPages.includes(page)) entry.mentionedInPages.push(page)
      }
      if (person) {
        entry.mentionedInPeople = entry.mentionedInPeople ?? []
        if (!entry.mentionedInPeople.includes(person)) entry.mentionedInPeople.push(person)
      }
      if (lat != null && lng != null && entry.lat == null && !inlineCoordFallback.has(name)) {
        inlineCoordFallback.set(name, { lat, lng })
      }
    }
  }

  // Read all daily notes in parallel
  await Promise.all(dates.map(async (date) => {
    const content = await readNote(date)
    if (content) processContent(content, date)
  }))

  // Read all pages — use display name (not slug) for mentionedInPages
  await Promise.all(pagesMeta.map(async (p) => {
    const content = await readPage(p.slug)
    if (content) processContent(content, undefined, p.name)
  }))

  // Read all person files — use display name (not slug) for mentionedInPeople
  await Promise.all(personsMeta.map(async (p) => {
    const content = await readPerson(p.slug)
    if (content) processContent(content, undefined, undefined, p.name)
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
