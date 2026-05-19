import { writePage, isValidPageName, renamePageFile } from '../../utils/notes'
import { toSlug, parseFrontmatterName, injectFrontmatterName } from '#shared/utils/location'
import { cacheInvalidate } from '../../utils/cache'

export default defineEventHandler(async (event) => {
  const raw = decodeURIComponent(getRouterParam(event, 'name') ?? '')
  const slug = toSlug(raw)
  if (!slug || !isValidPageName(slug)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid page name' })
  }
  // Migrate old file if slug changed
  if (raw !== slug) await renamePageFile(raw, slug)

  const body = await readBody<{ content: string }>(event)
  if (typeof body.content !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Content is required' })
  }

  // Inject name: frontmatter if the display name differs from slug
  let content = body.content
  const existingName = parseFrontmatterName(content)
  if (!existingName && raw !== slug) {
    content = injectFrontmatterName(content, raw)
  }

  await writePage(slug, content)
  cacheInvalidate('graph')
  return { success: true, slug, name: existingName ?? raw }
})
