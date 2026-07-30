// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { readNote } from './notes'
import { readPage } from './pages'
import { readPerson } from './persons'
import { readLocation } from './locations'
import { readLibrary } from './library'
import { toSlug } from '#shared/utils/location'
import { URL_FETCH_TIMEOUT_MS, MAX_URL_CONTENT_LENGTH } from './constants'
import type { LibrarySource } from '#shared/types/notes'

/**
 * Resolves content from various source types for library generation
 */
export async function resolveSourceContent(src: LibrarySource): Promise<string[]> {
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

/**
 * Fetches and cleans text content from a URL
 */
export async function fetchUrlText(url: string): Promise<string> {
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
  } catch (error: unknown) {
    return `[Failed to fetch content from ${url}]`
  }
}
