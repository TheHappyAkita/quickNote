// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { parseCoords } from '#shared/utils/coords'
import { injectFrontmatterName } from '#shared/utils/location'

/**
 * Processes generated library content by cleaning and formatting it
 */
export function processLibraryContent(
  generatedContent: string,
  title: string,
  slug: string
): string {
  // Remove markdown code fences if present
  let content = generatedContent
    .replace(/^```markdown\n/, '')
    .replace(/\n```$/, '')
    .trim()

  // Re-prefix location wikilinks that the model may have dropped the & from
  content = content
    .replace(/(?<!&)\[\[([^\]]+)\|([^\]]+)\]\]/g, (match, name, coords) => {
      return parseCoords(coords) ? `&[[${name.trim()}|${coords.trim()}]]` : match
    })
    .replace(/(?<!&)\[\[([^\]]+)\]\]/g, (match, inner) => {
      return parseCoords(inner) ? `&[[${inner.trim()}]]` : match
    })

  // Ensure title is present as H1 if not already
  if (!content.startsWith('# ')) {
    content = `# ${title}\n\n${content}`
  }

  // Inject frontmatter name for display purposes if slug changed
  if (slug !== title) {
    content = injectFrontmatterName(content, title)
  }

  return content
}
