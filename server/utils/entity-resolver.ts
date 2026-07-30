// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { toSlug } from '#shared/utils/location'

interface EntityMeta {
  name: string
  slug: string
  tags: string[]
}

/**
 * Resolves an entity slug from a raw name, with fallback to display name lookup
 */
export async function resolveEntitySlug<T extends EntityMeta>(
  raw: string,
  listFn: () => Promise<T[]>,
  readFn: (slug: string) => Promise<string | null>
): Promise<string | null> {
  const slug = toSlug(raw)
  
  // Try direct slug lookup first
  const content = await readFn(slug)
  if (content !== null) {
    return slug
  }
  
  // Fallback: search by display name
  const all = await listFn()
  const match = all.find((item: T) => item.name === raw)
  return match ? match.slug : null
}

/**
 * Resolves entity slug and migrates old file if needed
 */
export async function resolveAndMigrateEntity<T extends EntityMeta>(
  raw: string,
  listFn: () => Promise<T[]>,
  readFn: (slug: string) => Promise<string | null>,
  renameFn: (oldSlug: string, newSlug: string) => Promise<void>
): Promise<string> {
  const newSlug = toSlug(raw)
  
  // Check if new slug exists
  const newContent = await readFn(newSlug)
  if (newContent !== null) {
    return newSlug
  }
  
  // Check if old file exists with display name
  const all = await listFn()
  const match = all.find((item: T) => item.name === raw)
  
  if (match && match.slug !== newSlug) {
    // Migrate old file to new slug
    await renameFn(match.slug, newSlug)
  }
  
  return newSlug
}
