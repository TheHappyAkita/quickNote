export default defineEventHandler(async (event) => {
  const body = await readBody<{ username: string; password: string }>(event)

  if (!body?.username || !body?.password) {
    throw createError({ statusCode: 400, message: 'Username and password required' })
  }

  const valid = await validateUser(body.username, body.password)
  if (!valid) {
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }

  await setUserSession(event, { user: { username: body.username } })

  return { ok: true }
})
