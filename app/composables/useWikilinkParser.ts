// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { parseCoords } from '#shared/utils/coords'
import { sanitizeLocationSlug } from '#shared/utils/location'

function parseLocationParts(inner: string): { name?: string; lat?: number; lng?: number } {
  const parts = inner.split('|').map(p => p.trim())
  if (parts.length === 1) {
    const coordOnly = parseCoords(parts[0]!)
    if (coordOnly) return { lat: coordOnly.lat, lng: coordOnly.lng }
    return { name: parts[0] }
  }
  // &[[Name|coords]]
  const maybeCoords = parseCoords(parts[1]!)
  if (maybeCoords) return { name: parts[0], lat: maybeCoords.lat, lng: maybeCoords.lng }
  // fallback: treat as name only
  return { name: parts[0] }
}

export const EMOJI_MAP: Record<string, string> = {
  // Vehicles
  car: '🚗', bus: '🚌', train: '🚆', tram: '🚊', subway: '🚇',
  bike: '🚲', motorcycle: '🏍️', truck: '🚚', van: '🚐',
  plane: '✈️', helicopter: '🚁', rocket: '🚀', ship: '🚢',
  boat: '⛵', ferry: '🛳️', taxi: '🚕',
  // Places
  home: '🏠', office: '🏢', hospital: '🏥', school: '🏫',
  hotel: '🏨', restaurant: '🍽️', cafe: '☕', shop: '🛍️',
  park: '🌳', beach: '🏖️', mountain: '⛰️', airport: '🛫',
  world: '🌍', earth: '🌍', globe: '🌍',
  // Weather
  sun: '☀️', rain: '🌧️', snow: '❄️', cloud: '☁️',
  storm: '⛈️', wind: '💨', fog: '🌫️',
  // People & activities
  meeting: '👥', phone: '📞', email: '📧', note: '📝',
  idea: '💡', warning: '⚠️', check: '✅', cross: '❌',
  tick: '✅', question: '❓', exclamation: '❗',
  money: '💰', gift: '🎁', party: '🎉', birthday: '🎂',
  // Food & drink
  coffee: '☕', tea: '🍵', beer: '🍺', wine: '🍷',
  pizza: '🍕', burger: '🍔', sushi: '🍣',
  // Misc
  star: '⭐', heart: '❤️', fire: '🔥', key: '🔑',
  lock: '🔒', book: '📚', music: '🎵', camera: '📷',
  map: '🗺️', flag: '🚩', trophy: '🏆', target: '🎯',
}

export function useWikilinkParser(options?: {
  locationNicknames?: Map<string, string> | (() => Map<string, string>)
}) {
  function parseWikilinks(text: string): string {
    const locationNicknames = typeof options?.locationNicknames === 'function'
      ? options.locationNicknames()
      : options?.locationNicknames
    let html = text

    // Standard markdown hyperlinks: [text](url)
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="wiki-link">🔗 $1</a>',
    )

    // Datetime links: [[YYYY-MM-DD HH:MM]] or [[YYYY-MM-DD HH:MM:SS]]
    html = html.replace(
      /\[\[(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}(?::\d{2})?)\]\]/g,
      '<a href="/note/$1 $2" class="wiki-link">📅 $1 ⏰ $2</a>',
    )

    // Time notation: [[HH:MM]] or [[HH:MM:SS]] (no link, just styled)
    html = html.replace(
      /\[\[(\d{1,2}:\d{2}(?::\d{2})?)\]\]/g,
      '<span class="wiki-link time-link">⏰ $1</span>',
    )

    // Date links: [[YYYY-MM-DD]]
    html = html.replace(
      /\[\[(\d{4}-\d{2}-\d{2})\]\]/g,
      '<a href="/note/$1" class="wiki-link">📅 $1</a>',
    )

    // Person mentions: @[[Lastname, Forename]]
    html = html.replace(/@\[\[([^\]]+)\]\]/g, (_m, name: string) =>
      `<a href="/person/${encodeURIComponent(name.trim())}" class="wiki-link person-link">👤 ${name}</a>`,
    )

    // Location mentions: &[[...]](Nickname) or &[[...]]
    html = html.replace(/&\[\[([^\]]+)\]\](?:\(([^)]+)\))?/g, (_m, inner: string, nickname: string | undefined) => {
      const parsed = parseLocationParts(inner)
      if (!parsed.name) {
        const lat = parsed.lat!, lng = parsed.lng!
        const coordSlug = sanitizeLocationSlug(`${lat},${lng}`)
        const display = nickname ?? locationNicknames?.get(coordSlug) ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        return `<a href="/location/${encodeURIComponent(coordSlug)}" class="wiki-link location-link">📍 ${display}</a>`
      }
      const display = nickname ?? locationNicknames?.get(parsed.name) ?? parsed.name
      // Named locations always link to the location editor page
      return `<a href="/location/${encodeURIComponent(parsed.name)}" class="wiki-link location-link">📍 ${display}</a>`
    })

    // Page links: [[Page Name]] (non-date format)
    html = html.replace(
      /\[\[([a-zA-Z0-9_\- ][a-zA-Z0-9_\- ]+)\]\]/g,
      '<a href="/page/$1" class="wiki-link page-link">📄 $1</a>',
    )

    // Email addresses: user@example.com (skip if already inside an href)
    html = html.replace(
      /(?<!["=>])([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?![^<]*<\/a>)/g,
      '<a href="mailto:$1" class="wiki-link">📧 $1</a>',
    )

    // Emoji shortcodes: :name: → emoji (must not collide with existing syntax)
    html = html.replace(/:([a-z][a-z0-9_]*):/g, (_m, name: string) => {
      const emoji = EMOJI_MAP[name]
      return emoji ?? _m
    })

    return html
  }

  return { parseWikilinks }
}
