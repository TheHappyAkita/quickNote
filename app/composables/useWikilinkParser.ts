import { parseCoords } from '#shared/utils/coords'

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
  money: '💰', gift: '🎁', party: '🎉', birthday: '🎂',
  // Food & drink
  coffee: '☕', tea: '🍵', beer: '🍺', wine: '🍷',
  pizza: '🍕', burger: '🍔', sushi: '🍣',
  // Misc
  star: '⭐', heart: '❤️', fire: '🔥', key: '🔑',
  lock: '🔒', book: '📚', music: '🎵', camera: '📷',
  map: '🗺️', flag: '🚩', trophy: '🏆', target: '🎯',
}

export function useWikilinkParser() {
  function parseWikilinks(text: string): string {
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

    // Location mentions: &[[coord]], &[[Name]], or &[[Name|coord]]
    html = html.replace(/&\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/g, (_m, raw: string) => {
      const name = raw.trim()
      const coordOnly = parseCoords(name)
      if (coordOnly) {
        return `<a href="/map?lat=${coordOnly.lat}&lng=${coordOnly.lng}" class="wiki-link location-link">📍 ${coordOnly.lat.toFixed(5)}, ${coordOnly.lng.toFixed(5)}</a>`
      }
      return `<a href="/location/${encodeURIComponent(name)}" class="wiki-link location-link">📍 ${name}</a>`
    })

    // Page links: [[Page Name]] (non-date format)
    html = html.replace(
      /\[\[([a-zA-Z0-9_\- ][a-zA-Z0-9_\- ]+)\]\]/g,
      '<a href="/page/$1" class="wiki-link page-link">📄 $1</a>',
    )

    // Email addresses: user@example.com
    html = html.replace(
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
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
