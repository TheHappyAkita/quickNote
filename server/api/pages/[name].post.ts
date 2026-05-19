import { writePage, isValidPageName, renamePageFile } from '../../utils/notes'
import { sanitizePageName } from '#shared/utils/location'
import { cacheInvalidate } from '../../utils/cache'

export default defineEventHandler(async (event) => {
  const raw = decodeURIComponent(getRouterParam(event, 'name') ?? '')
  const name = sanitizePageName(raw)
  if (!name || !isValidPageName(name)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid page name' })
  }
  // Migrate old file if name changed after sanitization
  if (raw !== name) await renamePageFile(raw, name)

  const body = await readBody<{ content: string }>(event)
  if (typeof body.content !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Content is required' })
  }

  await writePage(name, body.content)
  cacheInvalidate('graph')
  return { success: true, name }
})
