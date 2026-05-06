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
          placeholder="Start writing… use [[YYYY-MM-DD]] to link to other notes"
          spellcheck="true"
          @input="handleInput"
          @keydown="handleKeydown"
          @blur="showSuggestions = false; emit('blur')"
        />
        <v-card
          v-if="showSuggestions && suggestions.length > 0"
          class="suggestions-dropdown"
          elevation="8"
        >
          <v-list density="compact" class="pa-0">
            <v-list-subheader class="px-3 py-1" style="font-size: 11px; opacity: 0.7">
              Link to note (↑↓ Enter/Tab)
            </v-list-subheader>
            <v-list-item
              v-for="(suggestion, index) in suggestions"
              :key="suggestion"
              :class="{ 'bg-primary': index === selectedSuggestion }"
              density="compact"
              @mousedown.prevent="insertSuggestion(suggestion)"
            >
              <template #prepend>
                <v-icon size="14" class="mr-1">mdi-calendar</v-icon>
              </template>
              <v-list-item-title class="text-body-2">{{ suggestion }}</v-list-item-title>
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

const props = defineProps<{
  modelValue: string
  date: string
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

const { data: allDates } = await useFetch<string[]>('/api/notes')

const wordCount = computed(() => {
  const text = props.modelValue.trim()
  return text ? text.split(/\s+/).length : 0
})

const renderedContent = computed(() => {
  let html = marked.parse(props.modelValue) as string
  html = html.replace(
    /\[\[(\d{4}-\d{2}-\d{2})\]\]/g,
    '<a href="/note/$1" class="wiki-link">$1</a>',
  )
  return html
})

function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  const value = target.value
  const cursorPos = target.selectionStart ?? 0
  const textBeforeCursor = value.substring(0, cursorPos)

  const match = textBeforeCursor.match(/\[\[([^\[\]]*)$/)
  if (match) {
    const query = match[1] ?? ''
    const filtered = (allDates.value ?? []).filter(
      (d) => d.startsWith(query) && d !== props.date,
    )
    suggestions.value = filtered.slice(0, 8)
    selectedSuggestion.value = 0
    showSuggestions.value = filtered.length > 0
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
  const linkStart = textBeforeCursor.lastIndexOf('[[')
  const newValue = value.substring(0, linkStart) + `[[${date}]]` + value.substring(cursorPos)

  emit('update:modelValue', newValue)
  showSuggestions.value = false

  nextTick(() => {
    if (textareaRef.value) {
      const newPos = linkStart + date.length + 4
      textareaRef.value.setSelectionRange(newPos, newPos)
      textareaRef.value.focus()
    }
  })
}
</script>

<style scoped>
.editor-wrapper {
  height: calc(100vh - 148px);
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
  font-size: 15px;
  line-height: 1.8;
}

.suggestions-dropdown {
  position: absolute;
  bottom: 8px;
  left: 8px;
  min-width: 200px;
  max-width: 260px;
  z-index: 200;
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

:deep(.preview-pane h1),
:deep(.preview-pane h2),
:deep(.preview-pane h3) {
  color: #9c8fff;
  margin-top: 1.2em;
  margin-bottom: 0.4em;
}

:deep(.preview-pane code) {
  background: #0f0f17;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 13px;
}

:deep(.preview-pane pre) {
  background: #0f0f17;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  border: 1px solid #2e2e4e;
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
</style>
