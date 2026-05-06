import { writePage, isValidPageName } from '../../utils/notes'

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name')
  if (!name || !isValidPageName(name)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid page name' })
  }

  const body = await readBody<{ content: string }>(event)
  if (typeof body.content !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Content is required' })
  }

  await writePage(name, body.content)
  return { success: true, name }
})
