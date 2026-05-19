import { deletePage, readPage, isValidPageName, renamePageFile } from '../../utils/notes'
import { sanitizePageName } from '#shared/utils/location'
import { cacheInvalidate } from '../../utils/cache'

export default defineEventHandler(async (event) => {
  const raw = decodeURIComponent(getRouterParam(event, 'name') ?? '')
  const name = sanitizePageName(raw)
  if (!name || !isValidPageName(name)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid page name' })
  }

  // Migrate old unsanitized file first so readPage and deletePage use canonical name
  if (raw !== name) await renamePageFile(raw, name)

  const content = await readPage(name)
  if (content === null) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  }

  await deletePage(name)
  cacheInvalidate('graph')
  return { success: true, name }
})
