import { deletePage, readPage, isValidPageName } from '../../utils/notes'
import { sanitizePageName } from '#shared/utils/location'
import { cacheInvalidate } from '../../utils/cache'

export default defineEventHandler(async (event) => {
  const raw = decodeURIComponent(getRouterParam(event, 'name') ?? '')
  const name = sanitizePageName(raw)
  if (!name || !isValidPageName(name)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid page name' })
  }

  // Check if page exists
  const content = await readPage(name)
  if (content === null) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  }

  await deletePage(name)
  cacheInvalidate('graph')
  return { success: true, name }
})
