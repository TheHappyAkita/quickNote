// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { stat } from 'fs/promises'
import { existsSync } from 'fs'
import { defineEventHandler, getQuery, createError } from 'h3'
import { exec } from 'child_process'
import { promisify } from 'util'

const execPromise = promisify(exec)

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const filePath = query.path as string

  if (!filePath) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing file path',
    })
  }

  // Security: only handle absolute paths starting with /
  if (!filePath.startsWith('/')) {
     throw createError({
      statusCode: 400,
      statusMessage: 'Only absolute paths are allowed',
    })
  }

  if (!existsSync(filePath)) {
    throw createError({
      statusCode: 404,
      statusMessage: `File not found: ${filePath}`,
    })
  }

  try {
    const s = await stat(filePath)
    if (!s.isFile() && !s.isDirectory()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Path is not a file or directory',
      })
    }

    // Determine the open command based on the OS
    // Since we know the user is on Linux from system info, we use xdg-open
    const opener = process.platform === 'win32' ? 'start ""' : process.platform === 'darwin' ? 'open' : 'xdg-open'
    
    // Execute the open command. 
    // We wrap the path in double quotes to handle spaces.
    await execPromise(`${opener} "${filePath}"`)

    return { ok: true }
  } catch (e: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Error opening file: ${e.message}`,
    })
  }
})
