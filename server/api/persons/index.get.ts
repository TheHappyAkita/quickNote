import { listPersonsWithMeta } from '../../utils/notes'

export default defineEventHandler(async () => {
  return listPersonsWithMeta()
})
