import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import type { CanvasState } from '#shared/types/notes'
import { getNotesDir, ensureNotesDir } from './notes'

const CANVAS_FILE = '.canvas.json'

export async function loadCanvas(): Promise<CanvasState> {
  await ensureNotesDir()
  try {
    const raw = await readFile(join(getNotesDir(), CANVAS_FILE), 'utf-8')
    return JSON.parse(raw) as CanvasState
  } catch {
    return { cards: [], edges: [] }
  }
}

export async function saveCanvas(state: CanvasState): Promise<void> {
  await ensureNotesDir()
  await writeFile(join(getNotesDir(), CANVAS_FILE), JSON.stringify(state, null, 2), 'utf-8')
}
