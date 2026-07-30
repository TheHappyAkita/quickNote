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

  interface PluginTheme {
    id: string
    label: string
    icon: string
    dark: boolean
    colors: Record<string, string>
  }

  function apply(name: AppThemeName): void {
    // If it's a plugin theme, make sure it's registered in Vuetify
    const pluginTheme = pluginThemes.value.find((t: PluginTheme) => t.id === name)
    if (pluginTheme && !vuetifyTheme.themes.value[name]) {
      vuetifyTheme.themes.value[name] = {
        dark: pluginTheme.dark,
        colors: pluginTheme.colors
      }
    }

    vuetifyTheme.global.name.value = name
    try {
      localStorage.setItem(STORAGE_KEY, name)
    } catch (error: unknown) {
      console.warn('Failed to save theme to localStorage:', error)
    }
  }

  function toggle() {
    const themes = allThemes.value
    const idx = themes.findIndex(t => t.id === current.value)
    const next = themes[(idx + 1) % themes.length]!
    apply(next.id)
  }

  function init(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
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
    } catch (error: unknown) {
      console.warn('Failed to load theme from localStorage:', error)
    }
  }

  return { current, themes: allThemes, apply, toggle, init }
}
