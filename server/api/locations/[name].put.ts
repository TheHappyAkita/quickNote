import { writeLocation, deleteLocation, isValidLocationName } from '../../utils/notes'
import { cacheInvalidate } from '../../utils/cache'

export default defineEventHandler(async (event) => {
  const name = decodeURIComponent(getRouterParam(event, 'name') ?? '')
  if (!name || !isValidLocationName(name)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid location name' })
  }
  const body = await readBody<{ content: string }>(event)
  if (typeof body?.content !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Content field required' })
  }
  if (!body.content.trim()) {
    await deleteLocation(name)
    cacheInvalidate('graph')
    return { ok: true, deleted: true }
  }
  await writeLocation(name, body.content)
  cacheInvalidate('graph')
  return { ok: true, deleted: false }
})
