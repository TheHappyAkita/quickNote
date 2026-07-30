// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { createContentNamespace } from '../../../server/utils/content-namespace'

describe('Content Namespace Abstraction', () => {
  let testDir: string

  beforeEach(async () => {
    testDir = join(tmpdir(), `quicknote-namespace-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
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

  it('should create a functional namespace', async () => {
    const testNamespace = createContentNamespace({
      dirName: 'test-namespace',
      type: 'test',
      maxNameLength: 50,
    })

    // Test write
    await testNamespace.write('test-entry', '# Test\n\nContent')

    // Test read - verify write worked
    const content = await testNamespace.read('test-entry')
    expect(content).toBe('# Test\n\nContent')

    // Test list - re-create namespace to ensure fresh read
    const freshNamespace = createContentNamespace({
      dirName: 'test-namespace',
      type: 'test',
      maxNameLength: 50,
    })
    const list = await freshNamespace.list()
    expect(list).toEqual(['test-entry'])

    // Test listWithMeta
    const meta = await testNamespace.listWithMeta()
    expect(meta).toHaveLength(1)
    expect(meta[0]).toMatchObject({
      slug: 'test-entry',
      name: 'test-entry',
    })

    // Test rename
    await testNamespace.rename('test-entry', 'renamed-entry')
    const renamedContent = await testNamespace.read('renamed-entry')
    expect(renamedContent).toBe('# Test\n\nContent')

    // Test delete
    await testNamespace.delete('renamed-entry')
    const deletedContent = await testNamespace.read('renamed-entry')
    expect(deletedContent).toBeNull()
  })

  it('should validate names according to pattern', async () => {
    const strictNamespace = createContentNamespace({
      dirName: 'strict',
      type: 'strict',
      maxNameLength: 10,
      namePattern: /^[a-z]+$/,
    })

    await expect(strictNamespace.write('ValidName', 'content')).rejects.toThrow('Invalid strict name')
    await expect(strictNamespace.write('valid', 'content')).resolves.not.toThrow()
  })

  it('should enforce max name length', async () => {
    const namespace = createContentNamespace({
      dirName: 'length-test',
      type: 'test',
      maxNameLength: 5,
    })

    await expect(namespace.write('toolong', 'content')).rejects.toThrow('Invalid test name')
    await expect(namespace.write('short', 'content')).resolves.not.toThrow()
  })

  it('should handle empty directories gracefully', async () => {
    const namespace = createContentNamespace({
      dirName: 'empty',
      type: 'empty',
      maxNameLength: 100,
    })

    const list = await namespace.list()
    expect(list).toEqual([])

    const meta = await namespace.listWithMeta()
    expect(meta).toEqual([])
  })

  it('should parse tags from content', async () => {
    const namespace = createContentNamespace({
      dirName: 'tags-test',
      type: 'test',
      maxNameLength: 100,
    })

    await namespace.write('tagged', '# Tagged\n\n#tag1 #tag2\n\nMore content #tag3')

    const meta = await namespace.listWithMeta()
    expect(meta[0].tags).toEqual(expect.arrayContaining(['tag1', 'tag2', 'tag3']))
  })

  it('should extract frontmatter name', async () => {
    const namespace = createContentNamespace({
      dirName: 'frontmatter-test',
      type: 'test',
      maxNameLength: 100,
    })

    await namespace.write('slug-name', '---\nname: Display Name\n---\n# Content')

    const meta = await namespace.listWithMeta()
    expect(meta[0]).toMatchObject({
      slug: 'slug-name',
      name: 'Display Name',
    })
  })
})
