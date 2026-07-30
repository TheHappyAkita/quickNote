// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { OLLAMA_TIMEOUT_MS } from './constants'
import type { OllamaSettings } from '#shared/types/notes'

interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OllamaChatResponse {
  message: {
    content: string
  }
}

/**
 * Calls Ollama API to generate content based on a prompt and sources
 */
export async function generateWithOllama(
  settings: OllamaSettings,
  title: string,
  prompt: string,
  sourceContents: string[]
): Promise<string> {
  if (!settings.url || !settings.model) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ollama not configured'
    })
  }

  const systemPrompt = `You are a research assistant. Create a well-structured Markdown reference article about "${title}". 
Use the provided sources. Include a "References" section at the end. 
Cite facts using the same wikilink syntax as the source headers, including the & prefix for location links.
At the end of the article, add 2-5 relevant inline tags like #tag1 #tag2.
Default to being concise but thorough.`

  const userPrompt = `${prompt}\n\nSOURCES:\n${sourceContents.join('\n\n')}`

  try {
    const response = await $fetch<OllamaChatResponse>(`${settings.url}/api/chat`, {
      method: 'POST',
      body: {
        model: settings.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ] as OllamaChatMessage[],
        stream: false,
      },
      timeout: OLLAMA_TIMEOUT_MS,
    })
    return response.message.content
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Ollama call failed:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `AI Generation failed: ${errorMessage}`
    })
  }
}
