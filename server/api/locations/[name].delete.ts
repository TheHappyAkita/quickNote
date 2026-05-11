import { deleteLocation, isValidLocationName } from '../../utils/notes'
import { cacheInvalidate } from '../../utils/cache'

export default defineEventHandler(async (event) => {
  const name = decodeURIComponent(getRouterParam(event, 'name') ?? '')
  if (!name || !isValidLocationName(name)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid location name' })
  }
  await deleteLocation(name)
  cacheInvalidate('graph')
  return { ok: true }
})
