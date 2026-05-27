// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { parseCoords } from './coords'

/** Chars unsafe on common filesystems (Windows + Unix). */
const UNSAFE_CHARS = /[#&?:*"<>|\\\/@!,]/g

/**
 * Convert a display name into a filesystem-safe slug.
 * Replaces all unsafe chars (incl. comma) with underscore, collapses runs, trims.
 * e.g. "Deer, John"  → "Deer_ John"  → collapsed → "Deer_John"
 * e.g. "O'Brien #2!" → "O_Brien _2_" → collapsed → "O_Brien_2"
 */
export function toSlug(raw: string): string {
  return raw
    .replace(UNSAFE_CHARS, '_')
    .replace(/'+/g, '')           // strip apostrophes entirely
    .replace(/_+/g, '_')          // collapse multiple underscores
    .replace(/\s+/g, ' ')         // collapse whitespace
    .replace(/[ _]+$/g, '')       // trim trailing
    .replace(/^[ _]+/g, '')       // trim leading
    .trim()
}

/**
 * Extract the display name from frontmatter `name:` field.
 * Returns null if not present.
 */
export function parseFrontmatterName(content: string): string | null {
  if (!content.startsWith('---')) return null
  const end = content.indexOf('\n---', 3)
  if (end === -1) return null
  const fm = content.slice(3, end)
  const m = /^name:\s*(.+)/m.exec(fm)
  return m ? m[1]!.trim() : null
}

/**
 * Inject or update the `name:` field in frontmatter.
 * If no frontmatter exists, prepends a new block.
 */
export function injectFrontmatterName(content: string, displayName: string): string {
  if (content.startsWith('---')) {
    const end = content.indexOf('\n---', 3)
    if (end !== -1) {
      const fm = content.slice(3, end)
      if (/^name:/m.test(fm)) {
        // Already has name: — replace it
        return '---' + fm.replace(/^name:.+$/m, `name: ${displayName}`) + content.slice(end)
      }
      // Insert name: as first field
      return `---\nname: ${displayName}${fm}\n---${content.slice(end + 4)}`
    }
  }
  // No frontmatter — prepend
  return `---\nname: ${displayName}\n---\n${content}`
}

/**
 * @deprecated Use toSlug() instead.
 * Kept for backwards compat — strips same unsafe chars but preserves commas.
 */
export function sanitizePersonName(raw: string): string {
  return toSlug(raw)
}

/**
 * @deprecated Use toSlug() instead.
 */
export function sanitizePageName(raw: string): string {
  return toSlug(raw)
}

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
