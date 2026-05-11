import { listPersons } from '../../utils/notes'

export default defineEventHandler(async () => {
  return listPersons()
})
