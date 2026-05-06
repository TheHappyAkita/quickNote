import type { GraphData } from '#shared/types/notes'
import { readFile, writeFile, readdir, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join, resolve } from 'path'
import { homedir } from 'os'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const PAGE_NAME_PATTERN = /^[a-zA-Z0-9_\- ]+$/
const WIKILINK_PATTERN = /\[\[(\d{4}-\d{2}-\d{2}|[a-zA-Z0-9_\- ]+)\]\]/g

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

export function extractLinks(content: string): string[] {
  const links: string[] = []
  let match: RegExpExecArray | null
  const re = new RegExp(WIKILINK_PATTERN.source, 'g')
  while ((match = re.exec(content)) !== null) {
    links.push(match[1]!)
  }
  return [...new Set(links)]
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

export async function buildGraph(): Promise<GraphData> {
  const dates = await listNotes()
  const dateSet = new Set(dates)

  const nodes: GraphData['nodes'] = dates.map((date) => ({
    data: { id: date, label: date, type: 'date' as const },
  }))
  const edges: GraphData['edges'] = []
  const seenEdges = new Set<string>()

  const kwFreq = new Map<string, { total: number; dates: Set<string> }>()

  for (const date of dates) {
    const content = await readNote(date)
    if (!content) continue

    const links = extractLinks(content)
    for (const target of links) {
      if (!dateSet.has(target)) continue
      const edgeKey = `${date}->${target}`
      if (seenEdges.has(edgeKey)) continue
      seenEdges.add(edgeKey)
      edges.push({ data: { id: edgeKey, source: date, target, type: 'wikilink' as const } })
    }

    const words = extractKeywords(content)
    const seen = new Set<string>()
    for (const w of words) {
      if (!kwFreq.has(w)) kwFreq.set(w, { total: 0, dates: new Set() })
      const entry = kwFreq.get(w)!
      entry.total++
      if (!seen.has(w)) { entry.dates.add(date); seen.add(w) }
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
      const edgeKey = `${date}->kw:${word}`
      edges.push({ data: { id: edgeKey, source: date, target: kwId, type: 'keyword' as const } })
    }
  }

  return { nodes, edges }
}
