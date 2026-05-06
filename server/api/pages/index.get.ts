import { listPages } from '../../utils/notes'

export default defineEventHandler(async (): Promise<string[]> => {
  return await listPages()
})
