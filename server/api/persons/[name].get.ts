import { readPerson, isValidPersonName } from '../../utils/notes'

export default defineEventHandler(async (event) => {
  const name = decodeURIComponent(getRouterParam(event, 'name') ?? '')
  if (!name || !isValidPersonName(name)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid person name' })
  }
  const content = await readPerson(name)
  return { name, content: content ?? '' }
})
