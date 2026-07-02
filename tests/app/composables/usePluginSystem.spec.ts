import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { usePluginSystem } from '../../../app/composables/usePluginSystem'
import type { QuickNotePlugin, QuickNoteAPI } from '#shared/types/plugins'

// Mock Nuxt globals
global.useState = vi.fn()

describe('usePluginSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const state = new Map()
    // @ts-ignore
    global.useState.mockImplementation((key, init) => {
      if (!state.has(key)) {
        state.set(key, ref(init ? init() : null))
      }
      return state.get(key)
    })
  })

  it('registers a plugin', () => {
    const { plugins, registerPlugin } = usePluginSystem()
    const plugin: QuickNotePlugin = {
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '1.0.0'
    }
    
    registerPlugin(plugin)
    expect(plugins.value.some(p => p.id === 'test-plugin')).toBe(true)
  })

  it('does not register duplicate plugin IDs', () => {
    const { plugins, registerPlugin } = usePluginSystem()
    const plugin: QuickNotePlugin = {
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '1.0.0'
    }
    
    registerPlugin(plugin)
    registerPlugin(plugin)
    expect(plugins.value.length).toBe(1)
  })

  it('applies markdown hooks', () => {
    const { registerPlugin, applyMarkdownHooks } = usePluginSystem()
    const plugin: QuickNotePlugin = {
      id: 'markdown-plugin',
      name: 'Markdown Plugin',
      version: '1.0.0',
      hooks: {
        'markdown:render': (text) => text.replace('foo', 'bar')
      }
    }
    
    registerPlugin(plugin)
    const result = applyMarkdownHooks('hello foo')
    expect(result).toBe('hello bar')
  })

  it('initializes plugins', async () => {
    const { registerPlugin, initializePlugins } = usePluginSystem()
    const setupSpy = vi.fn()
    const enableSpy = vi.fn()
    
    const plugin: QuickNotePlugin = {
      id: 'lifecycle-plugin',
      name: 'Lifecycle Plugin',
      version: '1.0.0',
      setup: setupSpy,
      onEnable: enableSpy
    }
    
    registerPlugin(plugin)
    
    const mockAPI = {
      stores: {},
      utils: {},
      storage: {
        getItem: vi.fn(),
        setItem: vi.fn()
      }
    } as unknown as QuickNoteAPI

    await initializePlugins(mockAPI)
    
    expect(setupSpy).toHaveBeenCalledWith(mockAPI)
    expect(enableSpy).toHaveBeenCalled()
  })

  it('collects suggestion providers from plugins', () => {
    const { registerPlugin, getSuggestionProviders } = usePluginSystem()
    const provider = {
      trigger: '/',
      mode: 'test',
      getSuggestions: () => ['a', 'b'],
      formatInsertion: (s: string) => s
    }
    
    const plugin: QuickNotePlugin = {
      id: 'suggest-plugin',
      name: 'Suggest Plugin',
      version: '1.0.0',
      hooks: {
        'editor:suggestions': () => [provider]
      }
    }
    
    registerPlugin(plugin)
    const providers = getSuggestionProviders()
    expect(providers).toContain(provider)
  })

  it('collects themes from plugins', () => {
    const { registerPlugin, getPluginThemes } = usePluginSystem()
    const theme = {
      id: 'custom-theme',
      label: 'Custom',
      icon: 'mdi-palette',
      dark: false,
      colors: { primary: '#ff0000' }
    }
    
    const plugin: QuickNotePlugin = {
      id: 'theme-plugin',
      name: 'Theme Plugin',
      version: '1.0.0',
      hooks: {
        'ui:themes': () => [theme]
      }
    }
    
    registerPlugin(plugin)
    const themes = getPluginThemes()
    expect(themes).toContain(theme)
  })
})
