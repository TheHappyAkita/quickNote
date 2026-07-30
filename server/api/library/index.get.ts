// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { listLibraryWithMeta } from '../../utils/library'

export default defineEventHandler(async () => {
  return await listLibraryWithMeta()
})
