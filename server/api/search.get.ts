import { listNotes, readNote, listPages, readPage } from '../utils/notes'

export interface SearchResult {
  type: 'note' | 'page'
  id: string // date for notes, name for pages
  title: string
  excerpt: string
  matches: number
}

export default defineEventHandler(async (event): Promise<SearchResult[]> => {
  const query = getQuery(event).q as string
  if (!query || query.trim().length < 2) {
    return []
  }

  const searchTerm = query.toLowerCase().trim()
  const results: SearchResult[] = []

  // Search daily notes
  const dates = await listNotes()
  await Promise.all(dates.map(async (date) => {
    const content = await readNote(date)
    // Match if date contains search term OR content contains it
    const dateMatch = date.toLowerCase().includes(searchTerm)
    const contentMatch = content?.toLowerCase().includes(searchTerm)

    if (dateMatch || contentMatch) {
      const contentLower = content?.toLowerCase() ?? ''
      // Find excerpts around matches
      const excerpts = content ? extractExcerpts(content, searchTerm, 3) : []
      const excerpt = excerpts.join(' … ') || (content?.slice(0, 160) ?? '')

      results.push({
        type: 'note',
        id: date,
        title: date,
        excerpt: excerpt.slice(0, 200),
        matches: countMatches(contentLower, searchTerm),
      })
    }
  }))

  // Search pages
  const pages = await listPages()
  await Promise.all(pages.map(async (page) => {
    const content = await readPage(page)
    // Match if page name contains search term OR content contains it
    const nameMatch = page.toLowerCase().includes(searchTerm)
    const contentMatch = content?.toLowerCase().includes(searchTerm)

    if (nameMatch || contentMatch) {
      const contentLower = content?.toLowerCase() ?? ''
      const excerpts = content ? extractExcerpts(content, searchTerm, 3) : []
      const excerpt = excerpts.join(' … ') || (content?.slice(0, 160) ?? '')

      results.push({
        type: 'page',
        id: page,
        title: page,
        excerpt: excerpt.slice(0, 200),
        matches: countMatches(contentLower, searchTerm),
      })
    }
  }))

  // Sort by number of matches (descending), then by date/page name
  return results.sort((a, b) => {
    if (b.matches !== a.matches) return b.matches - a.matches
    return a.id.localeCompare(b.id)
  })
})

function countMatches(content: string, term: string): number {
  let count = 0
  let pos = 0
  while ((pos = content.indexOf(term, pos)) !== -1) {
    count++
    pos += term.length
  }
  return count
}

function extractExcerpts(content: string, term: string, maxExcerpts: number): string[] {
  const excerpts: string[] = []
  const contentLower = content.toLowerCase()
  const termLen = term.length
  let pos = 0

  while ((pos = contentLower.indexOf(term, pos)) !== -1 && excerpts.length < maxExcerpts) {
    // Get context around the match (40 chars before and after)
    const start = Math.max(0, pos - 40)
    const end = Math.min(content.length, pos + termLen + 40)
    let excerpt = content.slice(start, end)

    // Clean up markdown formatting
    excerpt = excerpt
      .replace(/#{1,6}\s+/g, '')
      .replace(/\[\[([^\]]+)\]\]/g, '$1')
      .replace(/[*_`~>\[\]]/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    // Add ellipsis if truncated
    if (start > 0) excerpt = '…' + excerpt
    if (end < content.length) excerpt = excerpt + '…'

    excerpts.push(excerpt)
    pos += termLen
  }

  return excerpts
}
