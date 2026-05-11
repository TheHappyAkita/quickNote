import { deletePerson, isValidPersonName } from '../../utils/notes'
import { cacheInvalidate } from '../../utils/cache'

export default defineEventHandler(async (event) => {
  const name = decodeURIComponent(getRouterParam(event, 'name') ?? '')
  if (!name || !isValidPersonName(name)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid person name' })
  }
  await deletePerson(name)
  cacheInvalidate('graph')
  return { ok: true }
})
