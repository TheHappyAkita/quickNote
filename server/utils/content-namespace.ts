// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

/**
 * DRY abstraction for content namespaces (pages, library, people, locations).
 * Eliminates code duplication across similar CRUD operations.
 */

import { readFile, writeFile, readdir, mkdir, unlink, rename } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { getNotesDir, parseTags } from './notes'
import { parseFrontmatterName } from '#shared/utils/location'
import { runServerHook } from './plugins'

export interface ContentNamespace<TMeta extends { name: string; slug: string; tags: string[] }> {
  list: () => Promise<string[]>
  read: (name: string) => Promise<string | null>
  write: (name: string, content: string) => Promise<void>
  delete: (name: string) => Promise<void>
  listWithMeta: () => Promise<TMeta[]>
  rename: (oldName: string, newName: string) => Promise<void>
}

interface NamespaceConfig {
  dirName: string
  type: string
  maxNameLength: number
  namePattern?: RegExp
}

export function createContentNamespace<TMeta extends { name: string; slug: string; tags: string[] }>(
  config: NamespaceConfig
): ContentNamespace<TMeta> {
  const DEFAULT_NAME_PATTERN = /^[a-zA-Z0-9_\-\. äöüÄÖÜáéíóúàèìòùâêîôûãõ]+$/
  const { dirName, type, maxNameLength, namePattern = DEFAULT_NAME_PATTERN } = config

  function getDir(): string {
    return join(getNotesDir(), dirName)
  }

  async function ensureDir(): Promise<void> {
    const dir = getDir()
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true })
    }
  }

  function isValidName(name: string): boolean {
    return namePattern.test(name) && name.length > 0 && name.length <= maxNameLength
  }

  async function list(): Promise<string[]> {
    try {
      await ensureDir()
      const files = await readdir(getDir())
      return files
        .filter((f) => f.endsWith('.md'))
        .map((f) => f.replace('.md', ''))
        .sort()
    } catch (err) {
      console.error(`Failed to list ${type} entries:`, err)
      return []
    }
  }

  async function read(name: string): Promise<string | null> {
    if (!isValidName(name)) return null
    await ensureDir()
    const filePath = join(getDir(), `${name}.md`)
    try {
      return await readFile(filePath, 'utf-8')
    } catch {
      return null
    }
  }

  async function write(name: string, content: string): Promise<void> {
    if (!isValidName(name)) {
      throw new Error(`Invalid ${type} name`)
    }
    await ensureDir()
    const filePath = join(getDir(), `${name}.md`)
    await writeFile(filePath, content, 'utf-8')
    await runServerHook('server:onSave', { type, name, content })
  }

  async function deleteEntry(name: string): Promise<void> {
    if (!isValidName(name)) {
      throw new Error(`Invalid ${type} name`)
    }
    const filePath = join(getDir(), `${name}.md`)
    try {
      await unlink(filePath)
      await runServerHook('server:onDelete', { type, name })
    } catch {
      // Already deleted
    }
  }

  async function listWithMeta(): Promise<TMeta[]> {
    const slugs = await list()
    return Promise.all(
      slugs.map(async (slug) => {
        const content = await read(slug)
        const tags = content ? parseTags(content) : []
        const name = (content ? parseFrontmatterName(content) : null) ?? slug
        return { name, slug, tags } as TMeta
      })
    )
  }

  async function renameFile(oldName: string, newName: string): Promise<void> {
    if (oldName === newName) return
    const oldPath = join(getDir(), `${oldName}.md`)
    const newPath = join(getDir(), `${newName}.md`)
    if (existsSync(oldPath) && !existsSync(newPath)) {
      await rename(oldPath, newPath)
    }
  }

  return {
    list,
    read,
    write,
    delete: deleteEntry,
    listWithMeta,
    rename: renameFile,
  }
}
