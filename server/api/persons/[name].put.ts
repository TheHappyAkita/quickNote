import { writePerson, deletePerson, isValidPersonName, renamePersonFile } from '../../utils/notes'
import { sanitizePersonName } from '#shared/utils/location'
import { cacheInvalidate } from '../../utils/cache'

export default defineEventHandler(async (event) => {
  const raw = decodeURIComponent(getRouterParam(event, 'name') ?? '')
  const name = sanitizePersonName(raw)
  if (!name || !isValidPersonName(name)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid person name' })
  }
  // Migrate old file if name changed after sanitization
  if (raw !== name) await renamePersonFile(raw, name)
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
  return { ok: true, deleted: false, name }
})
