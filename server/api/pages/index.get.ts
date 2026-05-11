import type { NotePageMeta } from '#shared/types/notes'
import { listPagesWithMeta } from '../../utils/notes'

export default defineEventHandler(async (): Promise<NotePageMeta[]> => {
  return await listPagesWithMeta()
})
