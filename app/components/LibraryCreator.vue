<!-- Copyright (C) 2026 TheHappyAkita - SPDX-License-Identifier: GPL-3.0-only -->
<template>
  <v-card class="h-100 d-flex flex-column" rounded="0">
    <v-toolbar color="primary" density="compact">
      <v-btn icon="mdi-close" @click="emit('close')" />
      <v-toolbar-title>Library Entry Creator</v-toolbar-title>
      <v-spacer />
      <v-btn
        v-if="step > 1"
        variant="text"
        prepend-icon="mdi-chevron-left"
        @click="step--"
      >
        Back
      </v-btn>
      <v-btn
        v-if="step < 4"
        color="white"
        variant="tonal"
        append-icon="mdi-chevron-right"
        :disabled="!canGoNext"
        @click="step++"
      >
        Next
      </v-btn>
      <v-btn
        v-if="step === 4"
        color="success"
        variant="flat"
        prepend-icon="mdi-content-save"
        :loading="saving"
        @click="finish"
      >
        Finish
      </v-btn>
    </v-toolbar>

    <v-window v-model="step" class="flex-grow-1 overflow-auto">
      <!-- Step 1: Title -->
      <v-window-item :value="1" class="h-100">
        <v-container class="max-w-md mx-auto pt-12">
          <h2 class="text-h5 font-weight-bold mb-2">Start with a title</h2>
          <p class="text-body-2 text-medium-emphasis mb-6">
            What is the main topic of this library entry?
          </p>
          <v-text-field
            v-model="title"
            label="Entry Title"
            placeholder="e.g. My Research on Nuxt 4"
            variant="outlined"
            autofocus
            @keyup.enter="step = 2"
          />
        </v-container>
      </v-window-item>

      <!-- Step 2: Sources -->
      <v-window-item :value="2" class="h-100">
        <v-container class="max-w-lg mx-auto pt-8">
          <h2 class="text-h5 font-weight-bold mb-2">Select your sources</h2>
          <p class="text-body-2 text-medium-emphasis mb-6">
            Pick information from your notes to include in the summary.
          </p>

          <v-list density="compact" class="bg-transparent">
            <!-- Daily Notes -->
            <v-list-group value="notes">
              <template #activator="{ props }">
                <v-list-item v-bind="props" prepend-icon="mdi-calendar" title="Daily Notes" />
              </template>
              <v-list-item>
                <v-select
                  v-model="selectedNotes"
                  :items="allNotes"
                  label="Select Dates"
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                  density="compact"
                />
              </v-list-item>
            </v-list-group>

            <!-- Pages -->
            <v-list-group value="pages">
              <template #activator="{ props }">
                <v-list-item v-bind="props" prepend-icon="mdi-file-document-multiple" title="Pages" />
              </template>
              <v-list-item>
                <v-select
                  v-model="selectedPages"
                  :items="allPages"
                  item-title="name"
                  item-value="name"
                  label="Select Pages"
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                  density="compact"
                />
              </v-list-item>
            </v-list-group>

            <!-- People -->
            <v-list-group value="persons">
              <template #activator="{ props }">
                <v-list-item v-bind="props" prepend-icon="mdi-account-group" title="People" />
              </template>
              <v-list-item>
                <v-select
                  v-model="selectedPersons"
                  :items="allPersons"
                  item-title="name"
                  item-value="name"
                  label="Select People"
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                  density="compact"
                />
              </v-list-item>
            </v-list-group>

            <!-- Library -->
            <v-list-group value="library">
              <template #activator="{ props }">
                <v-list-item v-bind="props" prepend-icon="mdi-library-shelves" title="Existing Library Entries" />
              </template>
              <v-list-item>
                <v-select
                  v-model="selectedLibrary"
                  :items="allLibrary"
                  item-title="name"
                  item-value="name"
                  label="Select Entries"
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                  density="compact"
                />
              </v-list-item>
            </v-list-group>

            <!-- URLs -->
            <v-list-group value="urls">
              <template #activator="{ props }">
                <v-list-item v-bind="props" prepend-icon="mdi-link-variant" title="External URLs" />
              </template>
              <v-list-item v-for="(url, idx) in urls" :key="idx" class="px-0">
                <div class="d-flex gap-2 mb-2">
                  <v-text-field
                    v-model="url.url"
                    label="URL"
                    placeholder="https://..."
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                  <v-btn icon="mdi-delete" variant="text" color="error" @click="urls.splice(idx, 1)" />
                </div>
              </v-list-item>
              <v-list-item>
                <v-btn variant="tonal" size="small" prepend-icon="mdi-plus" @click="urls.push({ url: '' })">
                  Add URL
                </v-btn>
              </v-list-item>
            </v-list-group>

            <!-- Additional Info -->
            <v-list-group value="additional">
              <template #activator="{ props }">
                <v-list-item v-bind="props" prepend-icon="mdi-text-box-plus-outline" title="Additional Information" />
              </template>
              <v-list-item>
                <v-textarea
                  v-model="additionalInfo"
                  label="Extra context for the AI"
                  variant="outlined"
                  density="compact"
                  rows="3"
                />
              </v-list-item>
            </v-list-group>
          </v-list>
        </v-container>
      </v-window-item>

      <!-- Step 3: Prompt -->
      <v-window-item :value="3" class="h-100">
        <v-container class="max-w-md mx-auto pt-12">
          <h2 class="text-h5 font-weight-bold mb-2">Write your prompt</h2>
          <p class="text-body-2 text-medium-emphasis mb-6">
            Tell the AI exactly what you're interested in and how to structure the result.
          </p>
          <v-textarea
            v-model="prompt"
            label="AI Prompt"
            placeholder="e.g. Summarize the main architectural decisions in the selected sources. Use bullet points."
            variant="outlined"
            rows="6"
            auto-grow
          />
          <v-btn
            color="primary"
            block
            size="large"
            :loading="generating"
            @click="generate"
          >
            Generate with AI
          </v-btn>
        </v-container>
      </v-window-item>

      <!-- Step 4: Preview -->
      <v-window-item :value="4" class="h-100 d-flex flex-column">
        <v-container fluid class="pa-0 h-100 d-flex flex-column">
          <div class="pa-4 border-b d-flex align-center">
            <h2 class="text-h6 font-weight-bold">Preview</h2>
            <v-spacer />
            <v-btn
              variant="tonal"
              color="primary"
              size="small"
              prepend-icon="mdi-refresh"
              :loading="generating"
              @click="generate"
            >
              Regenerate
            </v-btn>
          </div>
          <div class="flex-grow-1 overflow-auto pa-4 markdown-preview" v-html="previewHtml" />
        </v-container>
      </v-window-item>
    </v-window>

    <v-overlay v-model="generating" persistent class="align-center justify-center">
      <v-card class="pa-8 text-center" rounded="xl" elevation="12">
        <v-progress-circular indeterminate size="64" color="primary" class="mb-4" />
        <div class="text-h6">AI is thinking...</div>
        <div class="text-caption text-medium-emphasis">This may take up to a minute</div>
      </v-card>
    </v-overlay>

    <v-snackbar v-model="errorShow" color="error" timeout="5000">
      {{ errorMessage }}
    </v-snackbar>
  </v-card>
</template>

<script setup lang="ts">
import { marked } from 'marked'
import type { NotePageMeta, LibraryMeta, LibrarySource, LibraryGenerationRequest } from '#shared/types/notes'

const emit = defineEmits<{
  close: []
  created: [slug: string]
}>()

const step = ref(1)
const title = ref('')
const selectedNotes = ref<string[]>([])
const selectedPages = ref<string[]>([])
const selectedPersons = ref<string[]>([])
const selectedLibrary = ref<string[]>([])
const urls = ref<{ url: string }[]>([])
const additionalInfo = ref('')
const prompt = ref('Create a well-structured reference article about this topic. Use the provided sources and include a References section at the end. Cite each fact with a wikilink or URL.')

const generatedContent = ref('')
const generating = ref(false)
const saving = ref(false)
const errorShow = ref(false)
const errorMessage = ref('')

// Load candidate data
const { data: allNotes } = await useFetch<string[]>('/api/notes', { server: false, default: () => [] })
const { data: allPages } = await useFetch<NotePageMeta[]>('/api/pages', { server: false, default: () => [] })
const { data: allPersons } = await useFetch<any[]>('/api/persons', { server: false, default: () => [] })
const { data: allLibrary } = await useFetch<LibraryMeta[]>('/api/library', { server: false, default: () => [] })

const canGoNext = computed(() => {
  if (step.value === 1) return title.value.trim().length > 0
  if (step.value === 2) {
    return selectedNotes.value.length > 0 || 
           selectedPages.value.length > 0 || 
           selectedPersons.value.length > 0 || 
           selectedLibrary.value.length > 0 || 
           urls.value.some(u => u.url.trim().length > 0) || 
           additionalInfo.value.trim().length > 0
  }
  if (step.value === 3) return prompt.value.trim().length > 0
  return true
})

const previewHtml = computed(() => {
  return marked.parse(generatedContent.value || '_No content generated yet_')
})

async function generate() {
  generating.value = true
  const sources: LibrarySource[] = []
  
  if (selectedNotes.value.length > 0) sources.push({ type: 'notes', dates: selectedNotes.value })
  if (selectedPages.value.length > 0) sources.push({ type: 'pages', names: selectedPages.value })
  if (selectedPersons.value.length > 0) sources.push({ type: 'persons', names: selectedPersons.value })
  if (selectedLibrary.value.length > 0) sources.push({ type: 'library', names: selectedLibrary.value })
  
  const validUrls = urls.value.filter(u => u.url.trim().length > 0).map(u => ({ url: u.url }))
  if (validUrls.length > 0) sources.push({ type: 'urls', urls: validUrls })
  
  if (additionalInfo.value.trim().length > 0) sources.push({ type: 'additional', text: additionalInfo.value })

    try {
      const res = await $fetch<{ success: boolean; slug: string; title: string }>('/api/library', {
        method: 'POST',
        body: {
          title: title.value,
          sources,
          prompt: prompt.value
        } as LibraryGenerationRequest
      })
      
      lastGeneratedSlug.value = res.slug
      const entry = await $fetch<{ content: string }>(`/api/library/${encodeURIComponent(res.slug)}`)
      generatedContent.value = entry.content
      step.value = 4
    } catch (err: any) {
    errorMessage.value = err.data?.statusMessage || 'Failed to generate content'
    errorShow.value = true
  } finally {
    generating.value = false
  }
}

async function saveEntry() {
  // Since POST already saved the initial version, we might just want to exit here,
  // or if the user edited the preview (we'd need an editor in step 4), save that.
  // For now, let's just finish the wizard.
  // We'll find the slug by searching for the title in the library or from the generation result.
  // I'll store the slug from generate().
  let slug = toSlug(title.value)
  // But wait, the server might have added a timestamp.
  // Let's re-run generate logic if needed or just navigate.
  // I will refactor generate to return the slug.
  
  // Re-finding the slug from the last generation result:
  // (In a real app, I'd store it in a ref)
  // For this implementation, I'll just close and the parent will refresh.
  // I need to emit the slug.
  
  // Let's refine generate to store the resulting slug.
}

const lastGeneratedSlug = ref('')
// I'll update generate() to set lastGeneratedSlug.value = res.slug

// Now update saveEntry:
function finish() {
  if (lastGeneratedSlug.value) {
    emit('created', lastGeneratedSlug.value)
  } else {
    emit('close')
  }
}

// Updating generate function in place above...
// (Self-correction: I'll just update the template to use the slug from the generation)
</script>

<script lang="ts">
// Helper for slugging in the frontend
function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ äöüÄÖÜáéíóúàèìòùâêîôûãõ]/g, (c) => {
      const map: Record<string, string> = {
        'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'Ä': 'ae', 'Ö': 'oe', 'Ü': 'ue',
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
        'à': 'a', 'è': 'e', 'ì': 'i', 'ò': 'o', 'ù': 'u',
        'â': 'a', 'ê': 'e', 'î': 'i', 'ô': 'o', 'û': 'u',
        'ã': 'a', 'õ': 'o', ' ': '-'
      }
      return map[c] || c
    })
    .replace(/[^a-z0-9\-_]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}
</script>

<style scoped>
.max-w-md { max-width: 500px; }
.max-w-lg { max-width: 800px; }
.gap-2 { gap: 8px; }
.markdown-preview :deep(h1) { font-size: 1.5rem; margin-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; }
.markdown-preview :deep(h2) { font-size: 1.25rem; margin-top: 1.5rem; margin-bottom: 0.75rem; }
.markdown-preview :deep(p) { margin-bottom: 1rem; line-height: 1.6; }
.markdown-preview :deep(ul), .markdown-preview :deep(ol) { margin-bottom: 1rem; padding-left: 1.5rem; }
.markdown-preview :deep(li) { margin-bottom: 0.25rem; }
</style>
