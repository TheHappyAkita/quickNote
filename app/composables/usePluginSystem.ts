// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import type { QuickNotePlugin, QuickNoteAPI } from '#shared/types/plugins'

// Use module-level state for plugins to avoid SSR serialization errors
// "useState" in Nuxt 3/4 attempts to serialize data for the client,
// but plugins contain functions (hooks, setup, etc.) which cannot be stringified.
const pluginsState = ref<QuickNotePlugin[]>([])
const isInitializedState = ref(false)

export function usePluginSystem() {
  const registerPlugin = (plugin: QuickNotePlugin) => {
    if (pluginsState.value.some(p => p.id === plugin.id)) {
      console.warn(`Plugin with ID ${plugin.id} is already registered.`)
      return
    }
    pluginsState.value.push(plugin)
  }

  /**
   * Generic hook executor that safely executes a hook across all plugins
   */
  function executeHook<T>(hookName: string): T[] {
    const results: T[] = []
    for (const plugin of pluginsState.value) {
      if (plugin.hooks?.[hookName]) {
        try {
          const hookFn = plugin.hooks[hookName] as () => T[]
          results.push(...hookFn())
        } catch (error: unknown) {
          console.error(`Error in plugin ${plugin.id} ${hookName}:`, error)
        }
      }
    }
    return results
  }

  const applyMarkdownHooks = (text: string): string => {
    let result = text
    for (const plugin of pluginsState.value) {
      if (plugin.hooks?.['markdown:render']) {
        try {
          result = plugin.hooks['markdown:render'](result)
        } catch (error: unknown) {
          console.error(`Error in plugin ${plugin.id} markdown:render:`, error)
        }
      }
    }
    return result
  }

  const getSuggestionProviders = () => executeHook('editor:suggestions')
  const getSidebarWidgets = () => executeHook('ui:sidebar')
  const getNavbarItems = () => executeHook('ui:navbar')
  const getPluginThemes = () => executeHook<{ id: string; label: string; icon: string; dark: boolean; colors: Record<string, string>; cssClass?: string }>('ui:themes')

  const initializePlugins = async (api: QuickNoteAPI): Promise<void> => {
    if (isInitializedState.value) return
    
    for (const plugin of pluginsState.value) {
      if (plugin.setup) {
        try {
          await plugin.setup(api)
        } catch (error: unknown) {
          console.error(`Error setting up plugin ${plugin.id}:`, error)
        }
      }
      if (plugin.onEnable) {
        try {
          plugin.onEnable()
        } catch (error: unknown) {
          console.error(`Error enabling plugin ${plugin.id}:`, error)
        }
      }
    }
    isInitializedState.value = true
  }

  return {
    plugins: pluginsState,
    registerPlugin,
    applyMarkdownHooks,
    getSuggestionProviders,
    getSidebarWidgets,
    getNavbarItems,
    initializePlugins,
    getPluginThemes
  }
}
