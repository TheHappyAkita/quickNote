// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import type { CanvasState } from '#shared/types/notes'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody<CanvasState>(event)
  await saveCanvas(id, body)
  return { ok: true }
})
