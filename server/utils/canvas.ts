import { readFile, writeFile, mkdir, unlink, access } from 'fs/promises'
import { join } from 'path'
import type { CanvasState, CanvasMeta } from '#shared/types/notes'
import { getNotesDir, ensureNotesDir } from './notes'

const CANVASES_DIR = '.canvases'
const INDEX_FILE = '_index.json'
const LEGACY_FILE = '.canvas.json'

function canvasesDir(): string {
  return join(getNotesDir(), CANVASES_DIR)
}

async function ensureCanvasesDir(): Promise<void> {
  await ensureNotesDir()
  await mkdir(canvasesDir(), { recursive: true })
}

function validId(id: string): boolean {
  return /^[a-z0-9-]+$/.test(id)
}

export async function loadCanvasList(): Promise<CanvasMeta[]> {
  await ensureCanvasesDir()
  const indexPath = join(canvasesDir(), INDEX_FILE)
  try {
    await access(indexPath)
  } catch {
    const now = new Date().toISOString()
    const defaultMeta: CanvasMeta = { id: 'default', name: 'Default', createdAt: now, updatedAt: now }
    let state: CanvasState = { cards: [], edges: [] }
    try {
      const raw = await readFile(join(getNotesDir(), LEGACY_FILE), 'utf-8')
      state = JSON.parse(raw) as CanvasState
    } catch { /* no legacy file */ }
    await writeFile(join(canvasesDir(), 'default.json'), JSON.stringify(state, null, 2))
    await writeFile(indexPath, JSON.stringify([defaultMeta], null, 2))
    return [defaultMeta]
  }
  const raw = await readFile(indexPath, 'utf-8')
  return JSON.parse(raw) as CanvasMeta[]
}

async function saveCanvasList(list: CanvasMeta[]): Promise<void> {
  await ensureCanvasesDir()
  await writeFile(join(canvasesDir(), INDEX_FILE), JSON.stringify(list, null, 2))
}

export async function loadCanvas(id: string): Promise<CanvasState> {
  if (!validId(id)) return { cards: [], edges: [] }
  await ensureCanvasesDir()
  try {
    const raw = await readFile(join(canvasesDir(), `${id}.json`), 'utf-8')
    return JSON.parse(raw) as CanvasState
  } catch {
    return { cards: [], edges: [] }
  }
}

export async function saveCanvas(id: string, state: CanvasState): Promise<void> {
  if (!validId(id)) return
  await ensureCanvasesDir()
  await writeFile(join(canvasesDir(), `${id}.json`), JSON.stringify(state, null, 2))
  const list = await loadCanvasList()
  const meta = list.find((c) => c.id === id)
  if (meta) {
    meta.updatedAt = new Date().toISOString()
    await saveCanvasList(list)
  }
}

export async function createCanvas(name: string): Promise<CanvasMeta> {
  const list = await loadCanvasList()
  const id = Date.now().toString(36)
  const now = new Date().toISOString()
  const meta: CanvasMeta = { id, name, createdAt: now, updatedAt: now }
  list.push(meta)
  await saveCanvasList(list)
  await writeFile(join(canvasesDir(), `${id}.json`), JSON.stringify({ cards: [], edges: [] }, null, 2))
  return meta
}

export async function renameCanvas(id: string, name: string): Promise<CanvasMeta> {
  const list = await loadCanvasList()
  const meta = list.find((c) => c.id === id)
  if (!meta) throw new Error('Canvas not found')
  meta.name = name
  meta.updatedAt = new Date().toISOString()
  await saveCanvasList(list)
  return meta
}

export async function removeNoteCardFromAllCanvases(date: string): Promise<void> {
  const list = await loadCanvasList()
  for (const meta of list) {
    const state = await loadCanvas(meta.id)
    const removedIds = new Set(
      state.cards
        .filter(c => c.type === 'note' && c.date === date)
        .map(c => c.id),
    )
    if (removedIds.size === 0) continue
    state.cards = state.cards.filter(c => !removedIds.has(c.id))
    state.edges = state.edges.filter(e => !removedIds.has(e.source) && !removedIds.has(e.target))
    await saveCanvas(meta.id, state)
  }
}

export async function deleteCanvas(id: string): Promise<void> {
  const list = await loadCanvasList()
  const idx = list.findIndex((c) => c.id === id)
  if (idx === -1) throw new Error('Canvas not found')
  list.splice(idx, 1)
  await saveCanvasList(list)
  try { await unlink(join(canvasesDir(), `${id}.json`)) } catch { /* ignore */ }
}
