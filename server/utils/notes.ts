import type { GraphData, NotePageMeta, LocationMeta } from '#shared/types/notes'
import { parseCoords } from '#shared/utils/coords'
import { sanitizePersonName, sanitizePageName, sanitizeLocationSlug } from '#shared/utils/location'
import { readFile, writeFile, readdir, mkdir, unlink, rename } from 'fs/promises'
import { existsSync } from 'fs'
import { join, resolve } from 'path'
import { homedir } from 'os'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const PAGE_NAME_PATTERN = /^[a-zA-Z0-9_\-\. äöüÄÖÜáéíóúàèìòùâêîôûãõ]+$/
const WIKILINK_PATTERN = /\[\[(\d{4}-\d{2}-\d{2}|[a-zA-Z0-9_\- ]+)\]\]/g
const PERSON_PATTERN = /@\[\[([^\]]+)\]\]/g
// Captures all pipe-separated parts inside &[[...]]
const LOCATION_PATTERN = /&\[\[([^\]]+)\]\]/g

const PAGES_DIR = 'pages'

export function getNotesDir(): string {
  const dir = process.env.NOTES_DIR || '~/.quickNote'
  if (dir.startsWith('~/')) {
    return join(homedir(), dir.slice(2))
  }
  if (dir.startsWith('~')) {
    return join(homedir(), dir.slice(1))
  }
  return resolve(dir)
}

export async function ensureNotesDir(): Promise<void> {
  const dir = getNotesDir()
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }
}

export async function listNotes(): Promise<string[]> {
  await ensureNotesDir()
  const dir = getNotesDir()
  const files = await readdir(dir)
  return files
    .filter((f) => f.endsWith('.md') && DATE_PATTERN.test(f.replace('.md', '')))
    .map((f) => f.replace('.md', ''))
    .sort()
}

export async function readNote(date: string): Promise<string | null> {
  if (!DATE_PATTERN.test(date)) return null
  await ensureNotesDir()
  const filePath = join(getNotesDir(), `${date}.md`)
  try {
    return await readFile(filePath, 'utf-8')
  } catch {
    return null
  }
}

export async function writeNote(date: string, content: string): Promise<void> {
  if (!DATE_PATTERN.test(date)) {
    throw new Error('Invalid date format')
  }
  await ensureNotesDir()
  const filePath = join(getNotesDir(), `${date}.md`)
  await writeFile(filePath, content, 'utf-8')
}

export async function deleteNote(date: string): Promise<void> {
  if (!DATE_PATTERN.test(date)) throw new Error('Invalid date format')
  const filePath = join(getNotesDir(), `${date}.md`)
  try { await unlink(filePath) } catch { /* already gone */ }
}

// Named notes (pages) functions
function getPagesDir(): string {
  return join(getNotesDir(), PAGES_DIR)
}

async function ensurePagesDir(): Promise<void> {
  const dir = getPagesDir()
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }
}

export function isValidPageName(name: string): boolean {
  return PAGE_NAME_PATTERN.test(name) && name.length > 0 && name.length <= 100
}

export async function renamePageFile(oldName: string, newName: string): Promise<void> {
  if (oldName === newName) return
  const oldPath = join(getPagesDir(), `${oldName}.md`)
  const newPath = join(getPagesDir(), `${newName}.md`)
  if (existsSync(oldPath) && !existsSync(newPath)) await rename(oldPath, newPath)
}

export async function listPages(): Promise<string[]> {
  await ensurePagesDir()
  const dir = getPagesDir()
  try {
    const files = await readdir(dir)
    return files
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace('.md', ''))
      .sort()
  } catch {
    return []
  }
}

export async function readPage(name: string): Promise<string | null> {
  if (!isValidPageName(name)) return null
  await ensurePagesDir()
  const filePath = join(getPagesDir(), `${name}.md`)
  try {
    return await readFile(filePath, 'utf-8')
  } catch {
    return null
  }
}

export async function writePage(name: string, content: string): Promise<void> {
  if (!isValidPageName(name)) {
    throw new Error('Invalid page name')
  }
  await ensurePagesDir()
  const filePath = join(getPagesDir(), `${name}.md`)
  await writeFile(filePath, content, 'utf-8')
}

export async function deletePage(name: string): Promise<void> {
  if (!isValidPageName(name)) {
    throw new Error('Invalid page name')
  }
  const { unlink } = await import('fs/promises')
  const filePath = join(getPagesDir(), `${name}.md`)
  await unlink(filePath)
}

// ─── People (person pages) ───────────────────────────────────────────────────

const PERSON_NAME_PATTERN = /^[a-zA-Z0-9,\. _\-äöüÄÖÜáéíóúàèìòùâêîôûãõ]+$/
const PEOPLE_DIR = 'people'

function getPeopleDir(): string {
  return join(getNotesDir(), PEOPLE_DIR)
}

async function ensurePeopleDir(): Promise<void> {
  const dir = getPeopleDir()
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }
}

export function isValidPersonName(name: string): boolean {
  return PERSON_NAME_PATTERN.test(name) && name.length > 0 && name.length <= 120
}

export async function renamePersonFile(oldName: string, newName: string): Promise<void> {
  if (oldName === newName) return
  const oldPath = join(getPeopleDir(), `${oldName}.md`)
  const newPath = join(getPeopleDir(), `${newName}.md`)
  if (existsSync(oldPath) && !existsSync(newPath)) await rename(oldPath, newPath)
}

export async function listPersons(): Promise<string[]> {
  await ensurePeopleDir()
  try {
    const files = await readdir(getPeopleDir())
    return files
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''))
      .sort()
  } catch {
    return []
  }
}

export async function readPerson(name: string): Promise<string | null> {
  if (!isValidPersonName(name)) return null
  await ensurePeopleDir()
  try {
    return await readFile(join(getPeopleDir(), `${name}.md`), 'utf-8')
  } catch {
    return null
  }
}

export async function writePerson(name: string, content: string): Promise<void> {
  if (!isValidPersonName(name)) throw new Error('Invalid person name')
  await ensurePeopleDir()
  await writeFile(join(getPeopleDir(), `${name}.md`), content, 'utf-8')
}

export async function deletePerson(name: string): Promise<void> {
  if (!isValidPersonName(name)) throw new Error('Invalid person name')
  try { await unlink(join(getPeopleDir(), `${name}.md`)) } catch { /* already gone */ }
}

export async function listPersonsWithMeta(): Promise<{ name: string; tags: string[] }[]> {
  const names = await listPersons()
  return Promise.all(names.map(async (name) => {
    const content = await readPerson(name)
    const tags = content ? parseTags(content) : []
    return { name, tags }
  }))
}

// ─── Locations ───────────────────────────────────────────────────────────────

const LOCATION_NAME_PATTERN = /^[a-zA-Z0-9,\. _\-@äöüÄÖÜáéíóúàèìòùâêîôûãõ]+$/
const LOCATIONS_DIR = 'locations'

function getLocationsDir(): string {
  return join(getNotesDir(), LOCATIONS_DIR)
}

async function ensureLocationsDir(): Promise<void> {
  const dir = getLocationsDir()
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }
}

export function isValidLocationName(name: string): boolean {
  return LOCATION_NAME_PATTERN.test(name) && name.length > 0 && name.length <= 120
}

export async function listLocations(): Promise<string[]> {
  await ensureLocationsDir()
  try {
    const files = await readdir(getLocationsDir())
    return files
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''))
      .sort()
  } catch {
    return []
  }
}

export async function readLocation(name: string): Promise<string | null> {
  if (!isValidLocationName(name)) return null
  await ensureLocationsDir()
  try {
    return await readFile(join(getLocationsDir(), `${name}.md`), 'utf-8')
  } catch {
    return null
  }
}

export async function writeLocation(name: string, content: string): Promise<void> {
  if (!isValidLocationName(name)) throw new Error('Invalid location name')
  await ensureLocationsDir()
  await writeFile(join(getLocationsDir(), `${name}.md`), content, 'utf-8')
}

export async function deleteLocation(name: string): Promise<void> {
  if (!isValidLocationName(name)) throw new Error('Invalid location name')
  try { await unlink(join(getLocationsDir(), `${name}.md`)) } catch { /* already gone */ }
}

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
  const names = await listLocations()
  return Promise.all(names.map(async (name) => {
    const content = await readLocation(name)
    const tags = content ? parseTags(content) : []
    const coords = content ? parseLocationCoords(content) : {}
    return { name, tags, ...coords }
  }))
}

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
  return { name: parts[0] }
}

// Matches &[[inner]] with optional (Nickname) suffix
const LOCATION_FULL_PATTERN = /&\[\[([^\]]+)\]\](?:\([^)]+\))?/g

export function extractLocationMentions(content: string): string[] {
  const seen = new Set<string>()
  let match: RegExpExecArray | null
  const re = new RegExp(LOCATION_FULL_PATTERN.source, 'g')
  while ((match = re.exec(content)) !== null) {
    const parsed = parseLocationParts(match[1]!)
    if (parsed.name) seen.add(parsed.name)
  }
  return [...seen]
}

export interface LocationMention {
  name: string
  lat?: number
  lng?: number
}

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
      continue
    }
    if (!seen.has(parsed.name)) {
      seen.set(parsed.name, { name: parsed.name, lat: parsed.lat, lng: parsed.lng })
    }
  }
  return [...seen.values()]
}

// ─── Tag utilities ───────────────────────────────────────────────────────────

export function parseFrontmatterTags(content: string): string[] {
  if (!content.startsWith('---')) return []
  const end = content.indexOf('\n---', 3)
  if (end === -1) return []
  const frontmatter = content.slice(3, end)
  // tags: [tag1, tag2]
  const inlineMatch = /^tags:\s*\[([^\]]*)\]/m.exec(frontmatter)
  if (inlineMatch) {
    return (inlineMatch[1] ?? '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
  }
  // tags:\n  - tag1
  const blockMatch = /^tags:\s*\n((?:[ \t]*-[ \t]+[^\n]+\n?)*)/m.exec(frontmatter)
  if (blockMatch) {
    return (blockMatch[1] ?? '').split('\n')
      .map(l => l.replace(/^[ \t]*-[ \t]+/, '').trim().toLowerCase())
      .filter(Boolean)
  }
  return []
}

export function parseInlineTags(content: string): string[] {
  // Skip over frontmatter
  let body = content
  if (content.startsWith('---')) {
    const end = content.indexOf('\n---', 3)
    if (end !== -1) body = content.slice(end + 4)
  }
  const tags: string[] = []
  const re = /#([a-zA-Z][a-zA-Z0-9_-]+)/g
  let match: RegExpExecArray | null
  while ((match = re.exec(body)) !== null) {
    tags.push(match[1]!.toLowerCase())
  }
  return [...new Set(tags)]
}

export function parseTags(content: string): string[] {
  return [...new Set([...parseFrontmatterTags(content), ...parseInlineTags(content)])].sort()
}

export function setFrontmatterTags(content: string, tags: string[]): string {
  const tagLine = tags.length > 0 ? `tags: [${tags.join(', ')}]` : null
  if (content.startsWith('---')) {
    const end = content.indexOf('\n---', 3)
    if (end !== -1) {
      const fm = content.slice(3, end).replace(/\ntags:[^\n]*(\n[ \t]+-[^\n]*)*/g, '')
      const rest = content.slice(end + 4)
      const cleaned = fm.trimEnd()
      if (tagLine) {
        return `---\n${cleaned ? cleaned + '\n' : ''}${tagLine}\n\n---${rest}`
      } else if (cleaned) {
        return `---\n${cleaned}\n\n---${rest}`
      } else {
        return rest.trimStart()
      }
    }
  }
  if (tagLine) return `---\n${tagLine}\n\n---\n${content}`
  return content
}

export async function listPagesWithMeta(): Promise<NotePageMeta[]> {
  const names = await listPages()
  return Promise.all(names.map(async (name) => {
    const content = await readPage(name)
    const tags = content ? parseTags(content) : []
    return { name, tags }
  }))
}

// ─── Link utilities ───────────────────────────────────────────────────────────

export function extractLinks(content: string): string[] {
  const links: string[] = []
  let match: RegExpExecArray | null
  const re = new RegExp(WIKILINK_PATTERN.source, 'g')
  while ((match = re.exec(content)) !== null) {
    links.push(match[1]!)
  }
  return [...new Set(links)]
}

export function extractPersonMentions(content: string): string[] {
  const mentions: string[] = []
  let match: RegExpExecArray | null
  const re = new RegExp(PERSON_PATTERN.source, 'g')
  while ((match = re.exec(content)) !== null) {
    mentions.push(match[1]!.trim())
  }
  return [...new Set(mentions)]
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'it',
  'its', 'i', 'my', 'me', 'we', 'our', 'us', 'you', 'your', 'he', 'she',
  'they', 'their', 'them', 'not', 'no', 'so', 'if', 'as', 'up', 'out',
  'about', 'into', 'than', 'then', 'just', 'also', 'very', 'more', 'some',
  'all', 'one', 'two', 'when', 'what', 'which', 'who', 'how', 'new',
])

function extractKeywords(content: string): string[] {
  return content
    .replace(/\[\[[\d-]+\]\]/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[`*_~\[\]()>#\-]/g, ' ')
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w) && !/^\d+$/.test(w))
}

const DATE_PATTERN_GRAPH = /^\d{4}-\d{2}-\d{2}$/

/** Read items in parallel batches to avoid overwhelming the filesystem. */
async function readInBatches<T>(
  items: string[],
  fn: (item: string) => Promise<T | null>,
  batchSize = 50,
): Promise<Array<T | null>> {
  const results: Array<T | null> = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = await Promise.all(items.slice(i, i + batchSize).map(fn))
    results.push(...batch)
  }
  return results
}

export async function buildGraph(): Promise<GraphData> {
  const dates = await listNotes()
  const pages = await listPages()
  const locations = await listLocations()
  const dateSet = new Set(dates)
  const pageSet = new Set(pages)

  // ── Phase 1: read ALL files in parallel batches ──────────────────────────
  const [dateContents, pageContents] = await Promise.all([
    readInBatches(dates, readNote),
    readInBatches(pages, readPage),
  ])

  // ── Phase 2: pure CPU processing (no I/O) ────────────────────────────────
  const nodes: GraphData['nodes'] = [
    ...dates.map((date) => ({ data: { id: date, label: date, type: 'date' as const } })),
    ...pages.map((page) => ({ data: { id: `page:${page}`, label: page, type: 'page' as const } })),
  ]
  const edges: GraphData['edges'] = []
  const seenEdges = new Set<string>()
  const kwFreq = new Map<string, { total: number; dates: Set<string> }>()
  const personMentions = new Map<string, Set<string>>()
  const locationMentions = new Map<string, Set<string>>()

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i]!
    const content = dateContents[i] ?? null
    if (!content) continue

    for (const name of extractPersonMentions(content)) {
      if (!personMentions.has(name)) personMentions.set(name, new Set())
      personMentions.get(name)!.add(date)
    }

    for (const name of extractLocationMentions(content)) {
      if (!locationMentions.has(name)) locationMentions.set(name, new Set())
      locationMentions.get(name)!.add(date)
    }

    for (const target of extractLinks(content)) {
      if (dateSet.has(target)) {
        const edgeKey = `${date}->${target}`
        if (!seenEdges.has(edgeKey)) { seenEdges.add(edgeKey); edges.push({ data: { id: edgeKey, source: date, target, type: 'wikilink' as const } }) }
      } else if (pageSet.has(target)) {
        const pageId = `page:${target}`
        const edgeKey = `${date}->${pageId}`
        if (!seenEdges.has(edgeKey)) { seenEdges.add(edgeKey); edges.push({ data: { id: edgeKey, source: date, target: pageId, type: 'wikilink' as const } }) }
      }
    }

    const seen = new Set<string>()
    for (const w of extractKeywords(content)) {
      if (!kwFreq.has(w)) kwFreq.set(w, { total: 0, dates: new Set() })
      const entry = kwFreq.get(w)!
      entry.total++
      if (!seen.has(w)) { entry.dates.add(date); seen.add(w) }
    }
  }

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]!
    const content = pageContents[i] ?? null
    if (!content) continue

    for (const name of extractPersonMentions(content)) {
      if (!personMentions.has(name)) personMentions.set(name, new Set())
      personMentions.get(name)!.add(`page:${page}`)
    }

    for (const name of extractLocationMentions(content)) {
      if (!locationMentions.has(name)) locationMentions.set(name, new Set())
      locationMentions.get(name)!.add(`page:${page}`)
    }

    for (const target of extractLinks(content)) {
      if (dateSet.has(target)) {
        const pageId = `page:${page}`
        const edgeKey = `${pageId}->${target}`
        if (!seenEdges.has(edgeKey)) { seenEdges.add(edgeKey); edges.push({ data: { id: edgeKey, source: pageId, target, type: 'wikilink' as const } }) }
      }
    }

    const seen = new Set<string>()
    for (const w of extractKeywords(content)) {
      if (!kwFreq.has(w)) kwFreq.set(w, { total: 0, dates: new Set() })
      const entry = kwFreq.get(w)!
      entry.total++
      if (!seen.has(w)) { entry.dates.add(`page:${page}`); seen.add(w) }
    }
  }

  for (const [name, sources] of locationMentions) {
    const locationId = `location:${name}`
    nodes.push({ data: { id: locationId, label: name, type: 'location' as const } })
    for (const source of sources) {
      const edgeKey = `${source}->${locationId}`
      if (!seenEdges.has(edgeKey)) {
        seenEdges.add(edgeKey)
        edges.push({ data: { id: edgeKey, source, target: locationId, type: 'wikilink' as const } })
      }
    }
  }

  for (const [name, sources] of personMentions) {
    const personId = `person:${name}`
    nodes.push({ data: { id: personId, label: name, type: 'person' as const } })
    for (const source of sources) {
      const edgeKey = `${source}->${personId}`
      if (!seenEdges.has(edgeKey)) {
        seenEdges.add(edgeKey)
        edges.push({ data: { id: edgeKey, source, target: personId, type: 'wikilink' as const } })
      }
    }
  }

  const topKeywords = [...kwFreq.entries()]
    .filter(([, v]) => v.dates.size >= 2 || v.total >= 3)
    .sort((a, b) => b[1].dates.size - a[1].dates.size || b[1].total - a[1].total)
    .slice(0, 40)

  for (const [word, { total, dates: kwDates }] of topKeywords) {
    const kwId = `kw:${word}`
    nodes.push({ data: { id: kwId, label: word, type: 'keyword' as const, weight: total } })
    for (const date of kwDates) {
      edges.push({ data: { id: `${date}->kw:${word}`, source: date, target: kwId, type: 'keyword' as const } })
    }
  }

  return { nodes, edges }
}
