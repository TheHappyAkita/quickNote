import { deleteLocation, isValidLocationName } from '../../utils/notes'
import { sanitizeLocationSlug } from '#shared/utils/location'
import { cacheInvalidate } from '../../utils/cache'

export default defineEventHandler(async (event) => {
  const raw = decodeURIComponent(getRouterParam(event, 'name') ?? '')
  const name = sanitizeLocationSlug(raw)
  if (!name || !isValidLocationName(name)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid location name' })
  }
  await deleteLocation(name)
  cacheInvalidate('graph')
  return { ok: true }
})
