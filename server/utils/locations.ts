// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import type { LocationMeta } from '#shared/types/notes'
import { createContentNamespace, type ContentNamespace } from './content-namespace'
import { MAX_LOCATION_NAME_LENGTH } from './constants'
import { parseTags, parseLocationParts, LOCATION_FULL_PATTERN } from './notes'
import { parseFrontmatterName } from '#shared/utils/location'

export interface LocationMention {
  name: string
  lat?: number
  lng?: number
}

const LOCATION_NAME_PATTERN = /^[a-zA-Z0-9,\. _\-@äöüÄÖÜáéíóúàèìòùâêîôûãõ]+$/

export function isValidLocationName(name: string): boolean {
  return LOCATION_NAME_PATTERN.test(name) && name.length > 0 && name.length <= MAX_LOCATION_NAME_LENGTH
}

const locationsNamespace: ContentNamespace<LocationMeta> = createContentNamespace({
  dirName: 'locations',
  type: 'location',
  maxNameLength: MAX_LOCATION_NAME_LENGTH,
  namePattern: LOCATION_NAME_PATTERN,
})

export const {
  list: listLocations,
  read: readLocation,
  write: writeLocation,
  delete: deleteLocation,
  rename: renameLocationFile,
} = locationsNamespace

function parseLocationCoords(content: string): { lat?: number; lng?: number; nickname?: string } {
  if (!content.startsWith('---')) return {}
  const end = content.indexOf('\n---', 3)
  if (end === -1) return {}
  const fm = content.slice(3, end)
  const latMatch = /^lat:\s*([\-0-9.]+)/m.exec(fm)
  const lngMatch = /^lng:\s*([\-0-9.]+)/m.exec(fm)
  const nickMatch = /^nickname:\s*(.+)/m.exec(fm)
  return {
    lat: latMatch ? parseFloat(latMatch[1]!) : undefined,
    lng: lngMatch ? parseFloat(lngMatch[1]!) : undefined,
    nickname: nickMatch ? nickMatch[1]!.trim() : undefined,
  }
}

export async function listLocationsWithMeta(): Promise<LocationMeta[]> {
  const slugs = await listLocations()
  return Promise.all(slugs.map(async (slug) => {
    const content = await readLocation(slug)
    const tags = content ? parseTags(content) : []
    const coords = content ? parseLocationCoords(content) : {}
    const name = (content ? parseFrontmatterName(content) : null) ?? slug
    return { name, slug, tags, ...coords }
  }))
}

/**
 * Extracts location mentions with coordinates from content
 */
export function extractLocationMentionsWithCoords(content: string): LocationMention[] {
  const seen = new Map<string, LocationMention>()
  let match: RegExpExecArray | null
  const re = new RegExp(LOCATION_FULL_PATTERN.source, 'g')
  while ((match = re.exec(content)) !== null) {
    const parsed = parseLocationParts(match[1]!)
    if (!parsed.name) {
      if (parsed.lat != null && parsed.lng != null) {
        const key = `${parsed.lat},${parsed.lng}`
        if (!seen.has(key)) seen.set(key, { name: key, lat: parsed.lat, lng: parsed.lng })
      }
    } else {
      if (!seen.has(parsed.name)) {
        seen.set(parsed.name, { name: parsed.name, lat: parsed.lat, lng: parsed.lng })
      }
    }
  }
  return [...seen.values()]
}
