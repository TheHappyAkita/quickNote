// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

/**
 * Simple module-level TTL cache for Nitro server.
 * Survives across requests within the same process lifetime.
 * Invalidated explicitly on mutations or by TTL expiry.
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const store = new Map<string, CacheEntry<unknown>>()

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key) as CacheEntry<T> | undefined
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return undefined
  }
  return entry.value
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
}

export function cacheInvalidate(...keys: string[]): void {
  for (const key of keys) store.delete(key)
}

export const CACHE_TTL = {
  GRAPH: 60_000,      // 60 seconds
  REMINDERS: 30_000,  // 30 seconds
} as const
