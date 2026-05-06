export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await deleteCanvas(id)
  return { ok: true }
})
