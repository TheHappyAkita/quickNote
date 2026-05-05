export default defineEventHandler(async (event) => {
  const date = getRouterParam(event, 'date')
  if (!date) {
    throw createError({ statusCode: 400, message: 'Date parameter required' })
  }

  const body = await readBody<{ content: string }>(event)
  if (typeof body?.content !== 'string') {
    throw createError({ statusCode: 400, message: 'Content field required' })
  }

  await writeNote(date, body.content)
  return { ok: true, date }
})
