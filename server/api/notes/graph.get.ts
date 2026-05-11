import { buildGraph } from '../../utils/notes'
import { cacheGet, cacheSet, CACHE_TTL } from '../../utils/cache'
import type { GraphData } from '#shared/types/notes'

export default defineEventHandler(async () => {
  const cached = cacheGet<GraphData>('graph')
  if (cached) return cached

  const data = await buildGraph()
  cacheSet('graph', data, CACHE_TTL.GRAPH)
  return data
})
