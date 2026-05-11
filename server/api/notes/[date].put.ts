import { deleteNote } from '../../utils/notes'
import { removeNoteCardFromAllCanvases } from '../../utils/canvas'

export default defineEventHandler(async (event) => {
  const date = getRouterParam(event, 'date')
  if (!date) {
    throw createError({ statusCode: 400, message: 'Date parameter required' })
  }

  const body = await readBody<{ content: string }>(event)
  if (typeof body?.content !== 'string') {
    throw createError({ statusCode: 400, message: 'Content field required' })
  }

  if (!body.content.trim()) {
    await deleteNote(date)
    await removeNoteCardFromAllCanvases(date)
    return { ok: true, deleted: true }
  }

  await writeNote(date, body.content)
  return { ok: true, deleted: false }
})
