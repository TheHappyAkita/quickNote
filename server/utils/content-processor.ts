// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { injectFrontmatterName } from '#shared/utils/location'

const PREVIEW_LENGTH = 160

/**
 * Generates a preview from markdown content by removing markdown syntax
 */
export function generatePreview(content: string): string {
  return content
    .replace(/^---[\s\S]*?---/m, '') // Remove frontmatter
    .replace(/^#+\s+/gm, '') // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
    .replace(/`([^`]+)`/g, '$1') // Remove inline code
    .trim()
    .slice(0, PREVIEW_LENGTH)
}

/**
 * Injects frontmatter name if display name differs from slug
 */
export function injectFrontmatterIfNeeded(
  content: string,
  raw: string,
  slug: string
): string {
  if (slug !== raw) {
    return injectFrontmatterName(content, raw)
  }
  return content
}
