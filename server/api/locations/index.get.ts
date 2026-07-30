// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { listLocationsWithMeta } from '../../utils/locations'

export default defineEventHandler(async () => {
  return listLocationsWithMeta()
})
