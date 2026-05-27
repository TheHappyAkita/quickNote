// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

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
