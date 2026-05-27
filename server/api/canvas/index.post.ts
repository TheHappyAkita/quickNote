// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name: string }>(event)
  if (!body?.name?.trim()) throw createError({ statusCode: 400, message: 'name required' })
  return createCanvas(body.name.trim())
})
