// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { useTheme } from 'vuetify'

const STORAGE_KEY = 'quicknote:theme'

export type AppThemeName = 'dark' | 'hackerGreen'

export const THEMES: { id: AppThemeName; label: string; icon: string }[] = [
  { id: 'dark',        label: 'Dark',          icon: 'mdi-weather-night' },
  { id: 'hackerGreen', label: 'Hacker',        icon: 'mdi-matrix' },
]

export function useAppTheme() {
  const vuetifyTheme = useTheme()

  const current = computed<AppThemeName>(() => vuetifyTheme.global.name.value as AppThemeName)

  function apply(name: AppThemeName) {
    vuetifyTheme.global.name.value = name
    try { localStorage.setItem(STORAGE_KEY, name) } catch {}
  }

  function toggle() {
    const idx = THEMES.findIndex(t => t.id === current.value)
    const next = THEMES[(idx + 1) % THEMES.length]!
    apply(next.id)
  }

  function init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as AppThemeName | null
      if (stored && THEMES.some(t => t.id === stored)) apply(stored)
    } catch {}
  }

  return { current, themes: THEMES, apply, toggle, init }
}
