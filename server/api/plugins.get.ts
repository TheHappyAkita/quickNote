// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { getNotesDir } from '../utils/notes'
import { readdir, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  const pluginsDir = join(getNotesDir(), 'plugins')
  
  if (!existsSync(pluginsDir)) {
    await mkdir(pluginsDir, { recursive: true })
    return []
  }

  try {
    const files = await readdir(pluginsDir)
    const pluginFiles = files.filter(f => f.endsWith('.json'))
    
    const plugins = []
    for (const file of pluginFiles) {
      try {
        const content = await readFile(join(pluginsDir, file), 'utf-8')
        const plugin = JSON.parse(content)
        // Basic validation: must have id and hooks
        if (plugin.id && plugin.hooks) {
          plugins.push(plugin)
        }
      } catch (e) {
        console.error(`Failed to load external plugin ${file}:`, e)
      }
    }
    
    return plugins
  } catch (e) {
    console.error('Failed to list external plugins:', e)
    return []
  }
})
