import { deletePerson, isValidPersonName } from '../../utils/notes'
import { sanitizePersonName } from '#shared/utils/location'
import { cacheInvalidate } from '../../utils/cache'

export default defineEventHandler(async (event) => {
  const raw = decodeURIComponent(getRouterParam(event, 'name') ?? '')
  const name = sanitizePersonName(raw)
  if (!name || !isValidPersonName(name)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid person name' })
  }
  await deletePerson(name)
  cacheInvalidate('graph')
  return { ok: true }
})
