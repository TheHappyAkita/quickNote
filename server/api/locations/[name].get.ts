import { readLocation, listLocationsWithMeta } from '../../utils/notes'
import { sanitizeLocationSlug } from '#shared/utils/location'

export default defineEventHandler(async (event) => {
  const raw = decodeURIComponent(getRouterParam(event, 'name') ?? '')
  if (!raw) throw createError({ statusCode: 400, statusMessage: 'Invalid location name' })
  const slug = sanitizeLocationSlug(raw)
  let content = await readLocation(slug)
  let resolvedSlug = slug
  if (content === null && raw !== slug) {
    // raw might be an old unsanitized filename or a display name
    const all = await listLocationsWithMeta()
    const match = all.find(l => l.name === raw || l.slug === raw)
    if (match) { resolvedSlug = match.slug; content = await readLocation(match.slug) }
  }
  return { name: raw, slug: resolvedSlug, content: content ?? '' }
})
