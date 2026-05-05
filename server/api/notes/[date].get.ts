export default defineEventHandler(async (event) => {
  const date = getRouterParam(event, 'date')
  if (!date) {
    throw createError({ statusCode: 400, message: 'Date parameter required' })
  }

  const content = await readNote(date)
  return { date, content: content ?? '' }
})
