import type { PageMeta } from '#shared/types/notes'
import { listPagesWithMeta } from '../../utils/notes'

export default defineEventHandler(async (): Promise<PageMeta[]> => {
  return await listPagesWithMeta()
})
