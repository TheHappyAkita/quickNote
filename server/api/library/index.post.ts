// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { writeLibrary, listLibrary } from '../../utils/library'
import { readNote } from '../../utils/notes'
import { isValidPageName } from '../../utils/pages'
import { getOllamaSettings } from '../../utils/settings'
import { toSlug } from '#shared/utils/location'
import { cacheInvalidate } from '../../utils/cache'
import { resolveSourceContent } from '../../utils/source-resolver'
import { generateWithOllama } from '../../utils/ollama-client'
import { processLibraryContent } from '../../utils/library-content-processor'
import type { LibraryGenerationRequest } from '#shared/types/notes'

export default defineEventHandler(async (event) => {
  const body = await readBody<LibraryGenerationRequest>(event)
  const { title, sources, prompt } = body

  if (!title || !prompt) {
    throw createError({ statusCode: 400, statusMessage: 'Title and prompt are required' })
  }

  const baseSlug = toSlug(title)
  if (!baseSlug || !isValidPageName(baseSlug)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid title' })
  }

  // Handle naming conflicts by adding timestamp if file exists
  const slug = await resolveUniqueSlug(baseSlug)

  // 1. Collect content from sources
  const sourceContents: string[] = []
  for (const src of sources) {
    const contents = await resolveSourceContent(src)
    sourceContents.push(...contents)
  }

  // 2. Call Ollama to generate content
  const settings = await getOllamaSettings()
  const generatedContent = await generateWithOllama(settings, title, prompt, sourceContents)

  // 3. Process and save the generated content
  const finalContent = processLibraryContent(generatedContent, title, slug)

  await writeLibrary(slug, finalContent)
  cacheInvalidate('graph')

  return { success: true, slug, title }
})

async function resolveUniqueSlug(baseSlug: string): Promise<string> {
  const existing = await listLibrary()
  if (!existing.includes(baseSlug)) {
    return baseSlug
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `${baseSlug}-${timestamp}`
}
