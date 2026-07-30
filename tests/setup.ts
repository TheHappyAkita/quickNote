// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { vi } from 'vitest'

// Mock Nuxt auto-imports that are not available in test environment
global.useRuntimeConfig = vi.fn(() => ({
  ollamaBaseUrl: 'http://localhost:11434',
  public: {},
}))

global.defineEventHandler = vi.fn((handler) => handler)
global.getRouterParam = vi.fn()
global.readBody = vi.fn()
global.createError = vi.fn((error) => {
  const err = new Error(error.statusMessage || error.message)
  Object.assign(err, error)
  return err
})
