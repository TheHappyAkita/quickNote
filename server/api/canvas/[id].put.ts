import type { CanvasState } from '#shared/types/notes'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody<CanvasState>(event)
  await saveCanvas(id, body)
  return { ok: true }
})
