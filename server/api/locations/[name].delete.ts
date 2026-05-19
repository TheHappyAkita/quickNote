import { deleteLocation, renameLocationFile, listLocationsWithMeta } from '../../utils/notes'
import { sanitizeLocationSlug } from '#shared/utils/location'
import { cacheInvalidate } from '../../utils/cache'

export default defineEventHandler(async (event) => {
  const raw = decodeURIComponent(getRouterParam(event, 'name') ?? '')
  if (!raw) throw createError({ statusCode: 400, statusMessage: 'Invalid location name' })
  const slug = sanitizeLocationSlug(raw)
  // Resolve via display name, direct slug, or sanitized slug
  const all = await listLocationsWithMeta()
  const match = all.find(l => l.slug === raw || l.slug === slug || l.name === raw)
  if (!match) throw createError({ statusCode: 404, statusMessage: 'Location not found' })
  const resolvedSlug = match.slug
  // Migrate old file if needed
  if (raw !== resolvedSlug) await renameLocationFile(raw, resolvedSlug)
  await deleteLocation(resolvedSlug)
  cacheInvalidate('graph')
  return { ok: true }
})
