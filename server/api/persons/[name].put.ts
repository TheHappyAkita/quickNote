import { writePerson, deletePerson, isValidPersonName } from '../../utils/notes'
import { cacheInvalidate } from '../../utils/cache'

export default defineEventHandler(async (event) => {
  const name = decodeURIComponent(getRouterParam(event, 'name') ?? '')
  if (!name || !isValidPersonName(name)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid person name' })
  }
  const body = await readBody<{ content: string }>(event)
  if (typeof body?.content !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Content field required' })
  }
  if (!body.content.trim()) {
    await deletePerson(name)
    cacheInvalidate('graph')
    return { ok: true, deleted: true }
  }
  await writePerson(name, body.content)
  cacheInvalidate('graph')
  return { ok: true, deleted: false }
})
