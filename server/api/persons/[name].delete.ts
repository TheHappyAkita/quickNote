import { deletePerson, renamePersonFile, listPersonsWithMeta } from '../../utils/notes'
import { toSlug } from '#shared/utils/location'
import { cacheInvalidate } from '../../utils/cache'

export default defineEventHandler(async (event) => {
  const raw = decodeURIComponent(getRouterParam(event, 'name') ?? '')
  if (!raw) throw createError({ statusCode: 400, statusMessage: 'Invalid person name' })
  let slug = toSlug(raw)
  // If slug doesn't map to a real file, resolve via display name or direct slug match
  const all = await listPersonsWithMeta()
  const match = all.find(p => p.slug === raw || p.slug === slug || p.name === raw)
  if (!match) throw createError({ statusCode: 404, statusMessage: 'Person not found' })
  slug = match.slug
  // Migrate old file if needed (e.g. raw was unsanitized old filename)
  if (raw !== slug) await renamePersonFile(raw, slug)
  await deletePerson(slug)
  cacheInvalidate('graph')
  return { ok: true }
})
