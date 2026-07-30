// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { writeLibrary, listLibrary, readLibrary } from '../../utils/library'
import { readNote, readPage, readPerson, readLocation, isValidPageName } from '../../utils/notes'
import { getOllamaSettings } from '../../utils/settings'
import { toSlug, injectFrontmatterName } from '#shared/utils/location'
import { cacheInvalidate } from '../../utils/cache'
import type { LibraryGenerationRequest, LibrarySource } from '#shared/types/notes'

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

  // 2. Call Ollama
  const settings = await getOllamaSettings()
  if (!settings.url || !settings.model) {
    throw createError({ statusCode: 400, statusMessage: 'Ollama not configured' })
  }

  const systemPrompt = `You are a research assistant. Create a well-structured Markdown reference article about "${title}". 
Use the provided sources. Include a "References" section at the end. 
Cite facts using wikilinks or URLs from the source headers.
Default to being concise but thorough.`

  const userPrompt = `${prompt}\n\nSOURCES:\n${sourceContents.join('\n\n')}`

  let generatedContent = ''
  try {
    const response = await $fetch<{ message: { content: string } }>(`${settings.url}/api/chat`, {
      method: 'POST',
      body: {
        model: settings.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: false,
      },
      timeout: OLLAMA_TIMEOUT_MS,
    })
    generatedContent = response.message.content
  } catch (err: any) {
    console.error('Ollama call failed:', err)
    throw createError({ statusCode: 500, statusMessage: `AI Generation failed: ${err.message}` })
  }

  // 3. Cleanup and Save
  // Remove markdown code fences if present
  generatedContent = generatedContent.replace(/^```markdown\n/, '').replace(/\n```$/, '').trim()
  
  // Ensure title is present as H1 if not already
  if (!generatedContent.startsWith('# ')) {
    generatedContent = `# ${title}\n\n${generatedContent}`
  }

  // Inject frontmatter name for display purposes if slug changed
  let finalContent = generatedContent
  if (slug !== title) {
    finalContent = injectFrontmatterName(generatedContent, title)
  }

  await writeLibrary(slug, finalContent)
  cacheInvalidate('graph')

  return { success: true, slug, title }
})

async function resolveSourceContent(src: LibrarySource): Promise<string[]> {
  const results: string[] = []
  
  switch (src.type) {
    case 'notes':
      if (src.dates) {
        for (const date of src.dates) {
          const content = await readNote(date)
          if (content) results.push(`--- Source: [[${date}]] ---\n${content}`)
        }
      }
      break
    case 'pages':
      for (const name of src.names) {
        const content = await readPage(toSlug(name))
        if (content) results.push(`--- Source: [[${name}]] ---\n${content}`)
      }
      break
    case 'persons':
      for (const name of src.names) {
        const content = await readPerson(toSlug(name))
        if (content) results.push(`--- Source: @[[${name}]] ---\n${content}`)
      }
      break
    case 'locations':
      for (const name of src.names) {
        const content = await readLocation(toSlug(name))
        if (content) results.push(`--- Source: &[[${name}]] ---\n${content}`)
      }
      break
    case 'library':
      for (const name of src.names) {
        const content = await readLibrary(toSlug(name))
        if (content) results.push(`--- Source: Library [[${name}]] ---\n${content}`)
      }
      break
    case 'urls':
      for (const item of src.urls) {
        const text = await fetchUrlText(item.url)
        results.push(`--- Source: ${item.url} ${item.note ? `(${item.note})` : ''} ---\n${text}`)
      }
      break
    case 'additional':
      results.push(`--- Source: Additional Information ---\n${src.text}`)
      break
  }
  
  return results
}

const OLLAMA_TIMEOUT_MS = 60000
const URL_FETCH_TIMEOUT_MS = 10000
const MAX_URL_CONTENT_LENGTH = 10000

async function resolveUniqueSlug(baseSlug: string): Promise<string> {
  const existing = await listLibrary()
  if (!existing.includes(baseSlug)) {
    return baseSlug
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `${baseSlug}-${timestamp}`
}

async function fetchUrlText(url: string): Promise<string> {
  try {
    const html = await $fetch<string>(url, {
      responseType: 'text',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; quickNote/1.0)' },
      timeout: URL_FETCH_TIMEOUT_MS,
    })
    return html
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
      .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX_URL_CONTENT_LENGTH)
  } catch (err) {
    return `[Failed to fetch content from ${url}]`
  }
}
