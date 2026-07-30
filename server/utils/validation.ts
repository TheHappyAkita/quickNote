// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const MAX_CONTENT_LENGTH = 10_000_000 // 10MB
const MAX_NAME_LENGTH = 200

/**
 * Validates a date string in YYYY-MM-DD format
 */
export function validateDateFormat(date: string): boolean {
  return DATE_REGEX.test(date)
}

/**
 * Validates content length
 */
export function validateContentLength(content: string): void {
  if (content.length > MAX_CONTENT_LENGTH) {
    throw createError({
      statusCode: 400,
      statusMessage: `Content too large. Maximum ${MAX_CONTENT_LENGTH} characters allowed.`
    })
  }
}

/**
 * Validates name length and characters
 */
export function validateName(name: string, maxLength: number = MAX_NAME_LENGTH): void {
  if (!name || name.trim().length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name is required'
    })
  }
  
  if (name.length > maxLength) {
    throw createError({
      statusCode: 400,
      statusMessage: `Name too long. Maximum ${maxLength} characters allowed.`
    })
  }
}

/**
 * Validates URL format
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validates and returns router parameter
 */
export function getValidatedRouterParam(event: any, paramName: string): string {
  const param = getRouterParam(event, paramName)
  if (!param) {
    throw createError({
      statusCode: 400,
      statusMessage: `${paramName} parameter is required`
    })
  }
  return param
}
