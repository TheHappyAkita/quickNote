import { listLocationsWithMeta } from '../../utils/notes'

export default defineEventHandler(async () => {
  return listLocationsWithMeta()
})
