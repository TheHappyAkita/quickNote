// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { getSettings, saveSettings, getOllamaSettings } from '../../../server/utils/settings'

describe('Settings Utilities', () => {
  let testDir: string

  beforeEach(async () => {
    testDir = join(tmpdir(), `quicknote-settings-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    await mkdir(testDir, { recursive: true })
    process.env.NOTES_DIR = testDir
  })

  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true, force: true })
    } catch {
      // Cleanup failed, ignore
    }
  })

  describe('getSettings', () => {
    it('should return default settings when file does not exist', async () => {
      const settings = await getSettings()
      expect(settings).toMatchObject({
        ollama: {
          url: 'http://localhost:11434',
          model: '',
        },
      })
    })

    it('should merge saved settings with defaults', async () => {
      await saveSettings({ ollama: { url: 'http://custom:8080', model: 'llama3.1' } })
      const settings = await getSettings()
      expect(settings.ollama.url).toBe('http://custom:8080')
      expect(settings.ollama.model).toBe('llama3.1')
    })
  })

  describe('saveSettings', () => {
    it('should save partial settings', async () => {
      await saveSettings({ ollama: { url: 'http://test:1234', model: 'test-model' } })
      const settings = await getSettings()
      expect(settings.ollama.url).toBe('http://test:1234')
      expect(settings.ollama.model).toBe('test-model')
    })

    it('should preserve existing settings when updating partial', async () => {
      await saveSettings({ ollama: { url: 'http://first:1111', model: 'first-model' } })
      await saveSettings({ ollama: { url: 'http://second:2222', model: 'second-model' } })
      const settings = await getSettings()
      expect(settings.ollama.url).toBe('http://second:2222')
      expect(settings.ollama.model).toBe('second-model')
    })
  })

  describe('getOllamaSettings', () => {
    it('should return ollama settings from main settings', async () => {
      await saveSettings({ ollama: { url: 'http://ollama:11434', model: 'llama3' } })
      const ollamaSettings = await getOllamaSettings()
      expect(ollamaSettings).toMatchObject({
        url: 'http://ollama:11434',
        model: 'llama3',
      })
    })

    it('should return default ollama settings when not configured', async () => {
      const ollamaSettings = await getOllamaSettings()
      expect(ollamaSettings.url).toBe('http://localhost:11434')
      expect(ollamaSettings.model).toBe('')
    })
  })
})
