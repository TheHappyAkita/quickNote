import { parseCoords } from '#shared/utils/coords'

export function useWikilinkParser() {
  function parseWikilinks(text: string): string {
    let html = text

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

    return html
  }

  return { parseWikilinks }
}
