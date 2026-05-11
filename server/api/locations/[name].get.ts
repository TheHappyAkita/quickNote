import { readLocation, isValidLocationName } from '../../utils/notes'

export default defineEventHandler(async (event) => {
  const name = decodeURIComponent(getRouterParam(event, 'name') ?? '')
  if (!name || !isValidLocationName(name)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid location name' })
  }
  const content = await readLocation(name)
  return { name, content: content ?? '' }
})
