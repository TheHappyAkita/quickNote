<!-- Copyright (C) 2026 TheHappyAkita - SPDX-License-Identifier: GPL-3.0-only -->
<template>
  <div class="editor-wrapper">
    <div class="d-flex align-center mb-2 gap-2">
      <v-btn-toggle v-model="viewMode" variant="outlined" divided density="compact" mandatory>
        <v-btn value="edit" size="small" title="Edit only">
          <v-icon size="16">mdi-pencil</v-icon>
        </v-btn>
        <v-btn value="split" size="small" title="Split view">
          <v-icon size="16">mdi-view-split-vertical</v-icon>
        </v-btn>
        <v-btn value="preview" size="small" title="Preview only">
          <v-icon size="16">mdi-eye</v-icon>
        </v-btn>
      </v-btn-toggle>
      <v-spacer />
      <v-chip size="x-small" color="secondary" variant="tonal">
        {{ wordCount }} words
      </v-chip>
    </div>

    <div class="editor-panes" :class="viewMode">
      <div v-show="viewMode !== 'preview'" class="editor-pane">
        <textarea
          ref="textareaRef"
          :value="modelValue"
          class="note-textarea"
          placeholder="Start writing… use [[YYYY-MM-DD]] for dates or [[Page Name]] for pages"
          spellcheck="true"
          @input="handleInput"
          @keydown="handleKeydown"
          @blur="showSuggestions = false; emit('blur')"
        />
        <v-card
          v-if="showSuggestions && suggestions.length > 0"
          class="suggestions-dropdown"
          elevation="8"
          :style="dropdownStyle"
        >
          <v-list density="compact" class="pa-0">
            <v-list-subheader class="px-3 py-1" style="font-size: 11px; opacity: 0.7">
              Link to (↑↓ Enter/Tab)
            </v-list-subheader>
            <v-list-item
              v-for="(suggestion, index) in suggestions"
              :key="suggestion"
              :class="{ 'bg-primary': index === selectedSuggestion }"
              density="compact"
              @mousedown.prevent="insertSuggestion(suggestion)"
            >
              <template #prepend>
                <v-icon v-if="suggestionMode === 'person'" size="14" class="mr-1" color="pink">mdi-account</v-icon>
                <v-icon v-else-if="suggestionMode === 'location'" size="14" class="mr-1" color="teal">mdi-map-marker</v-icon>
                <v-icon v-else-if="/^\d{4}-\d{2}-\d{2}$/.test(suggestion)" size="14" class="mr-1">mdi-calendar</v-icon>
                <v-icon v-else size="14" class="mr-1">mdi-file-document-outline</v-icon>
              </template>
              <v-list-item-title class="text-body-2">{{ suggestion }}</v-list-item-title>
              <v-list-item-subtitle v-if="suggestionMode === 'location' && locationNicknameMap.get(suggestion)" class="text-caption">{{ locationNicknameMap.get(suggestion) }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </div>

      <div
        v-show="viewMode !== 'edit'"
        class="preview-pane pa-4"
        v-html="renderedContent"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'
import { parseCoords } from '#shared/utils/coords'
import { sanitizeLocationSlug } from '#shared/utils/location'
import { EMOJI_MAP } from '~/composables/useWikilinkParser'

const props = defineProps<{
  modelValue: string
  date?: string
  pageName?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'blur': []
}>()

const viewMode = ref<'edit' | 'split' | 'preview'>('split')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const showSuggestions = ref(false)
const suggestions = ref<string[]>([])
const selectedSuggestion = ref(0)

const { data: allDates } = await useFetch<string[]>('/api/notes', { server: false, default: () => [] })
const { data: allPagesRaw } = await useFetch<{ name: string; tags: string[] }[]>('/api/pages', { server: false, default: () => [] })
const allPages = computed(() => allPagesRaw.value?.map(p => p.name) ?? [])
const { data: allPersonsRaw } = await useFetch<{ name: string; tags: string[] }[]>('/api/persons', { server: false, default: () => [] })
const allPersons = computed(() => allPersonsRaw.value?.map(p => p.name) ?? [])
const { data: allLocationsRaw } = await useFetch<{ name: string; tags: string[]; nickname?: string; lat?: number; lng?: number }[]>('/api/locations', { server: false, default: () => [], getCachedData: () => undefined })
const allLocations = computed(() => allLocationsRaw.value?.map(l => l.name) ?? [])
const locationMetaMap = computed(() => {
  const map = new Map<string, { nickname?: string; lat?: number; lng?: number }>()
  for (const l of allLocationsRaw.value ?? []) {
    const meta = { nickname: l.nickname, lat: l.lat, lng: l.lng }
    map.set(l.name, meta)
    // Also index under sanitized slug so pre-migrated files are found
    const slug = sanitizeLocationSlug(l.name)
    if (slug !== l.name) map.set(slug, meta)
  }
  return map
})
const locationNicknameMap = computed(() => {
  const map = new Map<string, string>()
  for (const l of allLocationsRaw.value ?? []) {
    if (l.nickname) {
      map.set(l.name, l.nickname)
      const slug = sanitizeLocationSlug(l.name)
      if (slug !== l.name) map.set(slug, l.nickname)
    }
  }
  return map
})

const dropdownStyle = ref({ top: '40px', left: '16px' })
const suggestionMode = ref<'link' | 'person' | 'location'>('link')

const wordCount = computed(() => {
  const text = props.modelValue.trim()
  return text ? text.split(/\s+/).length : 0
})

// Safe color map for named colors
const COLOR_MAP: Record<string, string> = {
  red: '#ff5252', orange: '#ff9800', yellow: '#ffd740', green: '#4caf50',
  blue: '#2196f3', purple: '#9c8fff', pink: '#f06292', teal: '#2dd4bf',
  gray: '#9e9e9e', grey: '#9e9e9e', white: '#ffffff',
}

function resolveColor(raw: string): string | null {
  const lower = raw.toLowerCase()
  if (COLOR_MAP[lower]) return COLOR_MAP[lower]!
  if (/^#[0-9a-fA-F]{3,6}$/.test(raw)) return raw
  return null
}

function renderLocationMentions(raw: string): string {
  return raw.replace(/&\[\[([^\]]+)\]\](?:\(([^)]+)\))?/g, (_m, inner: string, nickname: string | undefined) => {
    const parts = inner.split('|').map((p: string) => p.trim())
    let name: string | undefined, lat: number | undefined, lng: number | undefined
    if (parts.length === 1) {
      const c = parseCoords(parts[0]!); if (c) { lat = c.lat; lng = c.lng } else name = parts[0]
    } else {
      const c = parseCoords(parts[1]!); if (c) { name = parts[0]; lat = c.lat; lng = c.lng } else name = parts[0]
    }
    if (!name) {
      const coordSlug = sanitizeLocationSlug(`${lat},${lng}`)
      const coordMeta = locationMetaMap.value.get(coordSlug)
      const display = nickname ?? coordMeta?.nickname ?? `${lat!.toFixed(5)}, ${lng!.toFixed(5)}`
      return `<a href="/location/${encodeURIComponent(coordSlug)}" class="wiki-link location-link">📍 ${display}</a>`
    }
    const meta = locationMetaMap.value.get(name)
    const display = nickname ?? meta?.nickname ?? name
    // Named locations always link to the location editor page
    return `<a href="/location/${encodeURIComponent(name)}" class="wiki-link location-link">📍 ${display}</a>`
  })
}

const renderedContent = computed(() => {
  // Pre-process location mentions before marked so | and & aren't mangled
  const preprocessed = renderLocationMentions(props.modelValue)
  let html = marked.parse(preprocessed, {
    gfm: true,
    breaks: false,
  }) as string
  // Standard markdown hyperlinks: [text](url)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_match, text, url) => {
      const isFileLink = url.startsWith('file:')
      const target = isFileLink ? '' : ' target="_blank" rel="noopener noreferrer"'
      const icon = isFileLink ? '📁' : '🔗'
      return `<a href="${url}"${target} class="wiki-link">${icon} ${text}</a>`
    },
  )
  // Datetime links: [[YYYY-MM-DD HH:MM]] or [[YYYY-MM-DD HH:MM:SS]]
  html = html.replace(
    /\[\[(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}(?::\d{2})?)\]\]/g,
    '<a href="/note/$1 $2" class="wiki-link">📅 $1 ⏰ $2</a>',
  )
  // Time notation: [[HH:MM]] or [[HH:MM:SS]] (no link, just styled)
  html = html.replace(
    /\[\[(\d{1,2}:\d{2}(?::\d{2})?)\]\]/g,
    '<span class="wiki-link time-link">⏰ $1</span>',
  )
  // Date links: [[YYYY-MM-DD]]
  html = html.replace(
    /\[\[(\d{4}-\d{2}-\d{2})\]\]/g,
    '<a href="/note/$1" class="wiki-link">📅 $1</a>',
  )
  // Person mentions: @[[Lastname, Forename]]
  html = html.replace(/@\[\[([^\]]+)\]\]/g, (_m, name: string) =>
    `<a href="/person/${encodeURIComponent(name.trim())}" class="wiki-link person-link">👤 ${name}</a>`,
  )
  // Location mentions already handled in pre-processing step above
  // Page links: [[Page Name]] (non-date format)
  html = html.replace(
    /\[\[([a-zA-Z0-9_\- ][a-zA-Z0-9_\- ]+)\]\]/g,
    '<a href="/page/$1" class="wiki-link page-link">📄 $1</a>',
  )
  // Email addresses — decorate existing mailto links from marked, or create new ones
  html = html.replace(
    /<a href="(mailto:[^"]+)">([^<]+)<\/a>/g,
    '<a href="$1" class="wiki-link">📧 $2</a>',
  )
  html = html.replace(
    /(?<!["=>])([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?![^<]*<\/a>)/g,
    '<a href="mailto:$1" class="wiki-link">📧 $1</a>',
  )
  // Emoji shortcodes: :name: → emoji
  html = html.replace(/:([a-z][a-z0-9_]*):/g, (_m, name: string) => {
    const emoji = EMOJI_MAP[name]
    return emoji ?? _m
  })
  // Auto-color special note keywords (only at start of block elements, i.e. right after >)
  // Alert YYYY-MM-DD: text → red
  html = html.replace(/(>)(Alert(?:Me|er|a)?\s+\S+\s*:)([^<]*)/gi,
    '$1<span style="color:#ff5252">$2$3</span>')
  // Remind: / RemindMe: / Reminder: text → orange
  html = html.replace(/(>)(Remind(?:Me|er)?\s*:)([^<]*)/gi,
    '$1<span style="color:#ff9800">$2$3</span>')
  // Todo: / ToDo: / TODO: text → grey
  html = html.replace(/(>)(To-?Do\s*:)([^<]*)/gi,
    '$1<span style="color:#9e9e9e">$2$3</span>')
  // ==highlight== → yellow highlight
  html = html.replace(/==([^=\n]+)==/g, '<mark class="hl">$1</mark>')
  // [c=color]text[/c], [c=color]text[/], [color=name]text[/color], [color=name]text[/] → colored span
  html = html.replace(/\[(?:c|color)=([^\]]+)\]([\s\S]*?)\[\/(?:color|c)?\]/g, (_match, rawColor, text) => {
    const color = resolveColor(rawColor.trim())
    return color ? `<span style="color:${color}">${text}</span>` : text
  })
  // Open external links in a new tab; internal wikilinks stay in the same tab
  html = html.replace(/<a href="(https?:\/\/[^"]+)"/g, '<a href="$1" target="_blank" rel="noopener noreferrer"')
  return html
})

function getCursorCoords(textarea: HTMLTextAreaElement, pos: number): { top: number; left: number } {
  const textBefore = textarea.value.substring(0, pos)
  const lineNumber = (textBefore.match(/\n/g) ?? []).length
  const cs = window.getComputedStyle(textarea)
  const lineHeight = parseFloat(cs.lineHeight) || 24
  const paddingTop = parseFloat(cs.paddingTop) || 16
  const top = paddingTop + lineNumber * lineHeight - textarea.scrollTop + lineHeight + 4
  return {
    top: Math.max(8, Math.min(top, textarea.clientHeight - 220)),
    left: 16,
  }
}

function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  const value = target.value
  const cursorPos = target.selectionStart ?? 0
  const textBeforeCursor = value.substring(0, cursorPos)

  const personMatch = textBeforeCursor.match(/@\[\[([^\[\]]*)$/)
  const locationMatch = !personMatch && textBeforeCursor.match(/&\[\[([^\[\]]*)$/)
  const linkMatch = !personMatch && !locationMatch && textBeforeCursor.match(/\[\[([^\[\]]*)$/)

  if (personMatch) {
    suggestionMode.value = 'person'
    const query = personMatch[1] ?? ''
    suggestions.value = (allPersons.value ?? [])
      .filter(p => p.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 10)
    selectedSuggestion.value = 0
    showSuggestions.value = suggestions.value.length > 0
    if (showSuggestions.value) {
      const coords = getCursorCoords(target, cursorPos)
      dropdownStyle.value = { top: coords.top + 'px', left: Math.max(0, coords.left) + 'px' }
    }
  } else if (locationMatch) {
    suggestionMode.value = 'location'
    const query = locationMatch[1] ?? ''
    const queryLower = query.toLowerCase()
    suggestions.value = (allLocationsRaw.value ?? [])
      .filter(l => l.name.toLowerCase().includes(queryLower) || (l.nickname ?? '').toLowerCase().includes(queryLower))
      .map(l => l.name)
      .slice(0, 10)
    selectedSuggestion.value = 0
    showSuggestions.value = suggestions.value.length > 0
    if (showSuggestions.value) {
      const coords = getCursorCoords(target, cursorPos)
      dropdownStyle.value = { top: coords.top + 'px', left: Math.max(0, coords.left) + 'px' }
    }
  } else if (linkMatch) {
    suggestionMode.value = 'link'
    const query = linkMatch[1] ?? ''
    const queryLower = query.toLowerCase()
    const dateMatches = (allDates.value ?? []).filter(d => d.startsWith(query) && d !== props.date)
    const pageMatches = (allPages.value ?? []).filter(p => p.toLowerCase().includes(queryLower) && p !== props.pageName)
    suggestions.value = [...dateMatches, ...pageMatches].slice(0, 10)
    selectedSuggestion.value = 0
    showSuggestions.value = suggestions.value.length > 0
    if (showSuggestions.value) {
      const coords = getCursorCoords(target, cursorPos)
      dropdownStyle.value = { top: coords.top + 'px', left: Math.max(0, coords.left) + 'px' }
    }
  } else {
    showSuggestions.value = false
  }

  emit('update:modelValue', value)
}

function handleKeydown(event: KeyboardEvent) {
  if (!showSuggestions.value || suggestions.value.length === 0) return

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    selectedSuggestion.value = Math.min(selectedSuggestion.value + 1, suggestions.value.length - 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    selectedSuggestion.value = Math.max(selectedSuggestion.value - 1, 0)
  } else if (event.key === 'Enter' || event.key === 'Tab') {
    const suggestion = suggestions.value[selectedSuggestion.value]
    if (suggestion) {
      event.preventDefault()
      insertSuggestion(suggestion)
    }
  } else if (event.key === 'Escape') {
    showSuggestions.value = false
  }
}

function insertSuggestion(date: string) {
  if (!textareaRef.value) return
  const textarea = textareaRef.value
  const cursorPos = textarea.selectionStart ?? 0
  const value = textarea.value
  const textBeforeCursor = value.substring(0, cursorPos)
  const isPerson = suggestionMode.value === 'person'
  const isLocation = suggestionMode.value === 'location'
  const openBracket = isPerson
    ? textBeforeCursor.lastIndexOf('@[[')
    : isLocation
      ? textBeforeCursor.lastIndexOf('&[[')
      : textBeforeCursor.lastIndexOf('[[')
  let insertion: string
  if (isPerson) {
    insertion = `@[[${date}]]`
  } else if (isLocation) {
    const nick = locationNicknameMap.value.get(date)
    insertion = nick ? `&[[${date}]](${nick})` : `&[[${date}]]`
  } else {
    insertion = `[[${date}]]`
  }
  const newValue = value.substring(0, openBracket) + insertion + value.substring(cursorPos)

  emit('update:modelValue', newValue)
  showSuggestions.value = false

  nextTick(() => {
    if (textareaRef.value) {
      const prefix = isPerson ? '@[[' : isLocation ? '&[[' : '[['
      const newPos = openBracket + prefix.length + date.length + 2
      textareaRef.value.setSelectionRange(newPos, newPos)
      textareaRef.value.focus()
    }
  })
}
</script>

<style scoped>
.editor-wrapper {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.editor-panes {
  flex: 1;
  display: flex;
  gap: 12px;
  overflow: hidden;
  min-height: 0;
}

.editor-pane {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.editor-panes.preview .editor-pane { display: none; }
.editor-panes.edit .preview-pane { display: none; }

.note-textarea {
  flex: 1;
  width: 100%;
  padding: 16px;
  background: #1a1a2e;
  color: #e2e2e2;
  border: 1px solid #2e2e4e;
  border-radius: 8px;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 14px;
  line-height: 1.75;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
}

.note-textarea:focus {
  border-color: #6c63ff;
}

.preview-pane {
  flex: 1;
  overflow-y: auto;
  background: #1a1a2e;
  border: 1px solid #2e2e4e;
  border-radius: 8px;
  color: #e2e2e2;
  font-family: 'Fira Code', 'JetBrains Mono', 'Cascadia Code', monospace;
  font-feature-settings: "calt" 1;
  font-size: 15px;
  line-height: 1.8;
}

.suggestions-dropdown {
  position: absolute;
  min-width: 220px;
  max-width: 280px;
  z-index: 500;
  background: #1a1a2e !important;
  border: 1px solid #6c63ff !important;
}

:deep(.wiki-link) {
  color: #9c8fff;
  text-decoration: none;
  border-bottom: 1px dashed #6c63ff;
}

:deep(.wiki-link:hover) {
  color: #6c63ff;
}

:deep(mark.hl) {
  background: #ffd740;
  color: #0f0f17;
  padding: 0 3px;
  border-radius: 3px;
}

:deep(.preview-pane h1),
:deep(.preview-pane h2),
:deep(.preview-pane h3) {
  color: #9c8fff;
  margin-top: 1.2em;
  margin-bottom: 0.4em;
}

:deep(.preview-pane code) {
  background: #2e2e4e;
  color: #c8c0ff;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Fira Code', 'JetBrains Mono', 'Cascadia Code', monospace;
  font-size: 13px;
  font-feature-settings: "calt" 1;
}

:deep(.preview-pane pre) {
  background: #0f0f17;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  border: 1px solid #2e2e4e;
  font-family: 'Fira Code', 'JetBrains Mono', 'Cascadia Code', monospace;
  font-feature-settings: "calt" 1;
}

:deep(.preview-pane blockquote) {
  border-left: 3px solid #6c63ff;
  margin-left: 0;
  padding-left: 16px;
  color: #aaa;
}

:deep(.preview-pane ul),
:deep(.preview-pane ol) {
  padding-left: 1.6em;
  margin: 0.4em 0;
}

:deep(.preview-pane ul) { list-style-type: disc; }
:deep(.preview-pane ul ul) { list-style-type: circle; }
:deep(.preview-pane ul ul ul) { list-style-type: square; }
:deep(.preview-pane ol) { list-style-type: decimal; }

:deep(.preview-pane li) {
  margin: 0.15em 0;
}

:deep(.preview-pane li > ul),
:deep(.preview-pane li > ol) {
  margin: 0.1em 0;
}

:deep(.preview-pane table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
  font-size: 14px;
}

:deep(.preview-pane th),
:deep(.preview-pane td) {
  border: 1px solid #4a4a6e;
  padding: 6px 12px;
  text-align: left;
}

:deep(.preview-pane th) {
  background: #2e2e4e;
  color: #c8c0ff;
  font-weight: 600;
}

:deep(.preview-pane tr:nth-child(even) td) {
  background: rgba(108, 99, 255, 0.05);
}

:deep(.preview-pane tr:hover td) {
  background: rgba(108, 99, 255, 0.1);
}
</style>
