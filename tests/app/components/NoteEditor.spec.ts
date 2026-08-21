import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, computed } from 'vue'
import NoteEditor from '../../../app/components/NoteEditor.vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
  components,
  directives,
})

// Mock Nuxt globals
global.useState = vi.fn((key, init) => {
  return ref(init ? init() : null)
})
global.useFetch = vi.fn().mockReturnValue({
  data: ref([]),
  refresh: vi.fn(),
  pending: ref(false),
})
global.computed = computed
global.ref = ref

describe('NoteEditor.vue', () => {
  const mountEditor = (props = {}) => {
    return mount({
      template: '<Suspense><NoteEditor v-bind="props" /></Suspense>',
      components: { NoteEditor },
      setup() { return { props } }
    }, {
      global: {
        plugins: [vuetify],
        stubs: {
          'v-icon': true,
        }
      }
    })
  }

  it('renders correctly with initial content', async () => {
    const wrapper = mountEditor({
      modelValue: '# Hello World\nThis is a [[test]] note.',
    })
    
    // Wait for Suspense to resolve
    await new Promise(resolve => setTimeout(resolve, 0))
    
    expect(wrapper.find('textarea').element.value).toBe('# Hello World\nThis is a [[test]] note.')
    expect(wrapper.find('.preview-pane').html()).toContain('<h1>Hello World</h1>')
  })

  it('updates word count', async () => {
    const wrapper = mountEditor({
      modelValue: 'One two three',
    })
    
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(wrapper.text()).toContain('3 words')
  })

  it('toggles view modes', async () => {
    const wrapper = mountEditor({ modelValue: 'content' })
    
    await new Promise(resolve => setTimeout(resolve, 0))
    
    expect(wrapper.find('.editor-pane').isVisible()).toBe(true)
    expect(wrapper.find('.preview-pane').isVisible()).toBe(true)
    
    const editBtn = wrapper.find('button[value="edit"]')
    await editBtn.trigger('click')
    expect(wrapper.find('.editor-panes').classes()).toContain('edit')
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = mountEditor({ modelValue: '' })
    
    await new Promise(resolve => setTimeout(resolve, 0))
    
    const textarea = wrapper.find('textarea')
    await textarea.setValue('new content')
    
    // Note: emission will be from the child NoteEditor component
    const editor = wrapper.getComponent(NoteEditor)
    expect(editor.emitted('update:modelValue')).toBeTruthy()
    expect(editor.emitted('update:modelValue')![0]).toEqual(['new content'])
  })

  it('suggests meetings for wikilinks', async () => {
    global.useFetch = vi.fn((url: string) => ({
      data: ref(url === '/api/meetings' ? [{ name: 'Q3 Planning' }] : []),
      refresh: vi.fn(),
      pending: ref(false),
    }))

    const wrapper = mountEditor({ modelValue: '' })
    await new Promise(resolve => setTimeout(resolve, 0))

    await wrapper.find('textarea').setValue('[[Q3')

    expect(wrapper.findAll('.suggestions-dropdown .v-list-item-title').map(item => item.text())).toEqual(['Q3 Planning'])
  })

  it('sorts note proposals by date descending', async () => {
    global.useFetch = vi.fn((url: string) => ({
      data: ref(url === '/api/notes'
        ? ['2024-01-15', '2026-08-20', '2025-03-10']
        : []),
      refresh: vi.fn(),
      pending: ref(false),
    }))

    const wrapper = mountEditor({ modelValue: '' })
    await new Promise(resolve => setTimeout(resolve, 0))

    const textarea = wrapper.find('textarea')
    await textarea.setValue('[[')

    const proposals = wrapper.findAll('.suggestions-dropdown .v-list-item-title')
    expect(proposals.map(proposal => proposal.text())).toEqual([
      '2026-08-20',
      '2025-03-10',
      '2024-01-15',
    ])
  })
})
