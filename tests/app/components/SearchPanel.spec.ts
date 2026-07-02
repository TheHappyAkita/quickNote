import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SearchPanel from '../../../app/components/SearchPanel.vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
  components,
  directives,
})

// Mock $fetch globally
global.$fetch = vi.fn()

describe('SearchPanel.vue', () => {
  it('renders collapsed by default', () => {
    const wrapper = mount(SearchPanel, {
      global: {
        plugins: [vuetify],
        stubs: {
          'v-icon': true,
        }
      }
    })
    expect(wrapper.classes()).toContain('collapsed')
  })

  it('toggles when clicking the toggle button', async () => {
    const wrapper = mount(SearchPanel, {
      global: {
        plugins: [vuetify],
      }
    })
    const btn = wrapper.find('.search-toggle-btn')
    await btn.trigger('click')
    expect(wrapper.classes()).not.toContain('collapsed')
    
    await btn.trigger('click')
    expect(wrapper.classes()).toContain('collapsed')
  })

  it('performs search when typing and waiting for debounce', async () => {
    vi.useFakeTimers()
    const mockResults = [{ type: 'note', id: '2026-07-02', title: '2026-07-02', excerpt: 'Test', matches: 1 }]
    global.$fetch = vi.fn().mockResolvedValue(mockResults)

    const wrapper = mount(SearchPanel, {
      global: {
        plugins: [vuetify],
      }
    })
    
    // Open panel
    await wrapper.find('.search-toggle-btn').trigger('click')
    
    const input = wrapper.find('input')
    await input.setValue('test search')
    
    // Advance timers for debounce
    vi.advanceTimersByTime(400)
    
    expect(global.$fetch).toHaveBeenCalledWith('/api/search', expect.objectContaining({
      query: { q: 'test search' }
    }))
    
    // Wait for promise resolution
    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('2026-07-02')
    vi.useRealTimers()
  })

  it('shows "No results found" for empty response', async () => {
    vi.useFakeTimers()
    global.$fetch = vi.fn().mockResolvedValue([])

    const wrapper = mount(SearchPanel, {
      global: {
        plugins: [vuetify],
      }
    })
    
    await wrapper.find('.search-toggle-btn').trigger('click')
    const input = wrapper.find('input')
    await input.setValue('nonexistent')
    
    vi.advanceTimersByTime(400)
    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('No results found')
    vi.useRealTimers()
  })
})
