// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await deleteCanvas(id)
  return { ok: true }
})
