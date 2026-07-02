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

  const applyMarkdownHooks = (text: string): string => {
    let result = text
    for (const plugin of pluginsState.value) {
      if (plugin.hooks?.['markdown:render']) {
        try {
          result = plugin.hooks['markdown:render'](result)
        } catch (e) {
          console.error(`Error in plugin ${plugin.id} markdown:render:`, e)
        }
      }
    }
    return result
  }

  const getSuggestionProviders = () => {
    const providers = []
    for (const plugin of pluginsState.value) {
      if (plugin.hooks?.['editor:suggestions']) {
        try {
          providers.push(...plugin.hooks['editor:suggestions']())
        } catch (e) {
          console.error(`Error in plugin ${plugin.id} editor:suggestions:`, e)
        }
      }
    }
    return providers
  }

  const getSidebarWidgets = () => {
    const widgets = []
    for (const plugin of pluginsState.value) {
      if (plugin.hooks?.['ui:sidebar']) {
        try {
          widgets.push(...plugin.hooks['ui:sidebar']())
        } catch (e) {
          console.error(`Error in plugin ${plugin.id} ui:sidebar:`, e)
        }
      }
    }
    return widgets
  }

  const getNavbarItems = () => {
    const items = []
    for (const plugin of pluginsState.value) {
      if (plugin.hooks?.['ui:navbar']) {
        try {
          items.push(...plugin.hooks['ui:navbar']())
        } catch (e) {
          console.error(`Error in plugin ${plugin.id} ui:navbar:`, e)
        }
      }
    }
    return items
  }

  const getPluginThemes = () => {
    const themes: Array<{ id: string; label: string; icon: string; dark: boolean; colors: Record<string, string>; cssClass?: string }> = []
    for (const plugin of pluginsState.value) {
      if (plugin.hooks?.['ui:themes']) {
        try {
          themes.push(...plugin.hooks['ui:themes']())
        } catch (e) {
          console.error(`Error in plugin ${plugin.id} ui:themes:`, e)
        }
      }
    }
    return themes
  }

  const initializePlugins = async (api: QuickNoteAPI) => {
    if (isInitializedState.value) return
    
    for (const plugin of pluginsState.value) {
      if (plugin.setup) {
        try {
          await plugin.setup(api)
        } catch (e) {
          console.error(`Error setting up plugin ${plugin.id}:`, e)
        }
      }
      if (plugin.onEnable) {
        try {
          plugin.onEnable()
        } catch (e) {
          console.error(`Error enabling plugin ${plugin.id}:`, e)
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
