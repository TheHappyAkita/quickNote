export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }
  return { username: (session.user as { username: string }).username }
})
