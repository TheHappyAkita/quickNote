import { parseCoords } from './coords'

/**
 * Sanitize a location slug for use as a filename.
 *
 * - Coord-based slugs (parseable as "lat,lng" DD): encode as
 *   "lat@lng" replacing "." → "_"
 *   e.g. "41.3717065,2.1809545" → "41_3717065@2_1809545"
 *   e.g. "-41.3717,-2.1809"    → "-41_3717@-2_1809"
 *   "@" is safe on all major filesystems and unambiguous with negative coords.
 * - Name-based slugs: strip filesystem-unsafe chars and collapse whitespace.
 */
export function sanitizeLocationSlug(raw: string): string {
  const trimmed = raw.trim()
  const coords = parseCoords(trimmed)
  if (coords) {
    const lat = String(coords.lat).replace(/\./g, '_')
    const lng = String(coords.lng).replace(/\./g, '_')
    return `${lat}@${lng}`
  }
  return trimmed
    .replace(/[#&?:*"<>|\\\/]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Decode a coord-based slug back to "lat,lng" string.
 * e.g. "41_3717065@2_1809545" → "41.3717065,2.1809545"
 * Returns null if not a coord slug.
 */
export function decodeCoordSlug(slug: string): string | null {
  if (!slug.includes('@')) return null
  const atIdx = slug.indexOf('@')
  const lat = slug.substring(0, atIdx).replace(/_/g, '.')
  const lng = slug.substring(atIdx + 1).replace(/_/g, '.')
  if (!isNaN(Number(lat)) && !isNaN(Number(lng))) {
    return `${lat},${lng}`
  }
  return null
}
