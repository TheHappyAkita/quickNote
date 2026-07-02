import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { join } from 'path'
import { rm, mkdir, writeFile } from 'fs/promises'
import { existsSync } from 'fs'

// Mock Nitro's defineEventHandler
global.defineEventHandler = (handler: any) => handler

// Mock getNotesDir from server utils
vi.mock('../../utils/notes', () => ({
  getNotesDir: () => process.env.NOTES_DIR
}))

const TEST_NOTES_DIR = join(process.cwd(), '__test_plugins_dir')

describe('plugins autodiscovery API', () => {
  beforeEach(async () => {
    process.env.NOTES_DIR = TEST_NOTES_DIR
    if (existsSync(TEST_NOTES_DIR)) {
      await rm(TEST_NOTES_DIR, { recursive: true, force: true })
    }
    await mkdir(TEST_NOTES_DIR, { recursive: true })
  })

  afterEach(async () => {
    if (existsSync(TEST_NOTES_DIR)) {
      await rm(TEST_NOTES_DIR, { recursive: true, force: true })
    }
  })

  it('lists plugins from the plugins directory', async () => {
    const pluginsDir = join(TEST_NOTES_DIR, 'plugins')
    await mkdir(pluginsDir, { recursive: true })
    
    const testPlugin = {
      id: 'test-external',
      name: 'External Plugin',
      hooks: {
        'markdown:render': '() => {}'
      }
    }
    
    await writeFile(join(pluginsDir, 'test.json'), JSON.stringify(testPlugin))
    
    // Import the handler
    const handler = (await import('../../../server/api/plugins.get')).default
    
    // @ts-ignore
    const result = await handler({})
    
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('test-external')
  })

  it('returns empty array if plugins directory does not exist', async () => {
    const handler = (await import('../../../server/api/plugins.get')).default
    // @ts-ignore
    const result = await handler({})
    expect(result).toEqual([])
  })

  it('ignores invalid plugin files', async () => {
    const pluginsDir = join(TEST_NOTES_DIR, 'plugins')
    await mkdir(pluginsDir, { recursive: true })
    
    await writeFile(join(pluginsDir, 'invalid.json'), '{"invalid": "data"}')
    await writeFile(join(pluginsDir, 'not-json.txt'), 'hello')
    
    const handler = (await import('../../../server/api/plugins.get')).default
    // @ts-ignore
    const result = await handler({})
    
    expect(result).toHaveLength(0)
  })
})
