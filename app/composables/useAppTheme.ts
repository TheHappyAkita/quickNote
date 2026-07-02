// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { useTheme } from 'vuetify'
import { usePluginSystem } from './usePluginSystem'

const STORAGE_KEY = 'quicknote:theme'

export type AppThemeName = string

const DEFAULT_THEMES: { id: AppThemeName; label: string; icon: string }[] = [
  { id: 'dark',        label: 'Dark',          icon: 'mdi-weather-night' },
  { id: 'hackerGreen', label: 'Hacker',        icon: 'mdi-matrix' },
  { id: 'sepia',       label: 'Sepia',         icon: 'mdi-book-open-variant' },
]

export function useAppTheme() {
  const vuetifyTheme = useTheme()
  const { getPluginThemes } = usePluginSystem()

  const pluginThemes = computed(() => getPluginThemes())
  const allThemes = computed(() => [...DEFAULT_THEMES, ...pluginThemes.value])

  const current = computed<AppThemeName>(() => vuetifyTheme.global.name.value as AppThemeName)

  function apply(name: AppThemeName) {
    // If it's a plugin theme, make sure it's registered in Vuetify
    const pluginTheme = pluginThemes.value.find((t: any) => t.id === name)
    if (pluginTheme && !vuetifyTheme.themes.value[name]) {
      vuetifyTheme.themes.value[name] = {
        dark: pluginTheme.dark,
        colors: pluginTheme.colors
      } as any
    }

    vuetifyTheme.global.name.value = name
    try { localStorage.setItem(STORAGE_KEY, name) } catch {}
  }

  function toggle() {
    const themes = allThemes.value
    const idx = themes.findIndex(t => t.id === current.value)
    const next = themes[(idx + 1) % themes.length]!
    apply(next.id)
  }

  function init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as AppThemeName | null
      if (stored) {
        // If stored theme is a plugin theme, we need to wait for plugins or register it now
        // For now, let's just check if it's in allThemes
        if (allThemes.value.some(t => t.id === stored)) {
          apply(stored)
        } else {
          // Fallback to dark if theme not found yet
          apply('dark')
        }
      }
    } catch {}
  }

  return { current, themes: allThemes, apply, toggle, init }
}
