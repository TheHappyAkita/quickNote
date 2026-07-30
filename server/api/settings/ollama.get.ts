// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { getOllamaSettings } from '../../utils/settings'

export default defineEventHandler(async () => {
  return await getOllamaSettings()
})
