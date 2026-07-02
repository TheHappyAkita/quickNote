// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { activePlugins } from '~/plugins/registry'
import { usePluginSystem } from '~/composables/usePluginSystem'

export default defineNuxtPlugin(async (nuxtApp) => {
  const { registerPlugin, initializePlugins } = usePluginSystem()

  // Register all active plugins
  for (const plugin of activePlugins) {
    registerPlugin(plugin)
  }

  // Initialize plugins on client-side
  if (import.meta.client) {
    const api = {
      stores: {}, // Will be populated as needed
      utils: {},
      storage: {
        getItem: async (key: string) => localStorage.getItem(key),
        setItem: async (key: string, value: any) => localStorage.setItem(key, value)
      }
    }
    await initializePlugins(api)
  }
})
