// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { activePlugins } from '~/plugins/registry'
import { usePluginSystem } from '~/composables/usePluginSystem'

export default defineNuxtPlugin(async (nuxtApp) => {
  const { registerPlugin, initializePlugins } = usePluginSystem()

  // Initialize plugins on client-side
  if (import.meta.client) {
    // Register all active internal plugins
    for (const plugin of activePlugins) {
      registerPlugin(plugin)
    }

    // Register external plugins from NOTES_DIR/plugins
    try {
      const externalPlugins = await $fetch('/api/plugins')
      if (Array.isArray(externalPlugins)) {
        for (const plugin of externalPlugins) {
          registerPlugin(plugin as any)
        }
      }
    } catch (e) {
      console.error('Failed to load external plugins:', e)
    }

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
