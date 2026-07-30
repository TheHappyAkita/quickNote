<!-- Copyright (C) 2026 TheHappyAkita - SPDX-License-Identifier: GPL-3.0-only -->
<template>
  <v-card class="d-flex flex-column library-creator-card">
    <v-toolbar color="primary" density="compact">
      <v-toolbar-title>Library Entry Creator</v-toolbar-title>
      <v-spacer />
      <v-chip variant="text" color="white">
        Step {{ step }} of 3
      </v-chip>
      <v-btn 
        icon="mdi-close" 
        variant="text" 
        class="toolbar-close-btn"
        @click="emit('close')" 
      />
    </v-toolbar>

    <v-window v-model="step" class="flex-grow-1 library-creator-window">
      <!-- Step 1: Title -->
      <v-window-item :value="1" class="h-100">
        <v-container class="max-w-md mx-auto pt-4">
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
        <v-container class="max-w-lg mx-auto pt-4">
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
              <v-list-item class="autocomplete-container">
                <v-autocomplete
                  v-model="selectedNotes"
                  v-model:menu="notesMenuOpen"
                  :items="allNotes"
                  label="Select Dates"
                  placeholder="Search or select dates..."
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                  density="compact"
                  clearable
                >
                  <template #prepend-item>
                    <v-list-item
                      v-if="allNotes.length > 0"
                      title="Select All"
                      @click="selectAllNotes"
                    >
                      <template #prepend>
                        <v-checkbox-btn
                          :model-value="selectedNotes.length === allNotes.length"
                          :indeterminate="selectedNotes.length > 0 && selectedNotes.length < allNotes.length"
                        />
                      </template>
                    </v-list-item>
                    <v-divider />
                  </template>
                </v-autocomplete>
              </v-list-item>
            </v-list-group>

            <!-- Pages -->
            <v-list-group value="pages">
              <template #activator="{ props }">
                <v-list-item v-bind="props" prepend-icon="mdi-file-document-multiple" title="Pages" />
              </template>
              <v-list-item class="autocomplete-container">
                <v-autocomplete
                  v-model="selectedPages"
                  v-model:menu="pagesMenuOpen"
                  :items="allPages"
                  item-title="name"
                  item-value="name"
                  label="Select Pages"
                  placeholder="Search or select pages..."
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                  density="compact"
                  clearable
                >
                  <template #prepend-item>
                    <v-list-item
                      v-if="allPages.length > 0"
                      title="Select All"
                      @click="selectAllPages"
                    >
                      <template #prepend>
                        <v-checkbox-btn
                          :model-value="selectedPages.length === allPages.length"
                          :indeterminate="selectedPages.length > 0 && selectedPages.length < allPages.length"
                        />
                      </template>
                    </v-list-item>
                    <v-divider />
                  </template>
                </v-autocomplete>
              </v-list-item>
            </v-list-group>

            <!-- People -->
            <v-list-group value="persons">
              <template #activator="{ props }">
                <v-list-item v-bind="props" prepend-icon="mdi-account-group" title="People" />
              </template>
              <v-list-item class="autocomplete-container">
                <v-autocomplete
                  v-model="selectedPersons"
                  v-model:menu="personsMenuOpen"
                  :items="allPersons"
                  item-title="name"
                  item-value="name"
                  label="Select People"
                  placeholder="Search or select people..."
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                  density="compact"
                  clearable
                >
                  <template #prepend-item>
                    <v-list-item
                      v-if="allPersons.length > 0"
                      title="Select All"
                      @click="selectAllPersons"
                    >
                      <template #prepend>
                        <v-checkbox-btn
                          :model-value="selectedPersons.length === allPersons.length"
                          :indeterminate="selectedPersons.length > 0 && selectedPersons.length < allPersons.length"
                        />
                      </template>
                    </v-list-item>
                    <v-divider />
                  </template>
                </v-autocomplete>
              </v-list-item>
            </v-list-group>

            <!-- Library -->
            <v-list-group value="library">
              <template #activator="{ props }">
                <v-list-item v-bind="props" prepend-icon="mdi-library-shelves" title="Existing Library Entries" />
              </template>
              <v-list-item class="autocomplete-container">
                <v-autocomplete
                  v-model="selectedLibrary"
                  v-model:menu="libraryMenuOpen"
                  :items="allLibrary"
                  item-title="name"
                  item-value="name"
                  label="Select Entries"
                  placeholder="Search or select library entries..."
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                  density="compact"
                  clearable
                >
                  <template #prepend-item>
                    <v-list-item
                      v-if="allLibrary.length > 0"
                      title="Select All"
                      @click="selectAllLibrary"
                    >
                      <template #prepend>
                        <v-checkbox-btn
                          :model-value="selectedLibrary.length === allLibrary.length"
                          :indeterminate="selectedLibrary.length > 0 && selectedLibrary.length < allLibrary.length"
                        />
                      </template>
                    </v-list-item>
                    <v-divider />
                  </template>
                </v-autocomplete>
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
        <v-container class="max-w-md mx-auto pt-4">
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
        </v-container>
      </v-window-item>

    </v-window>

    <v-divider />

    <v-card-actions class="pa-4">
      <v-btn
        v-if="step > 1"
        variant="outlined"
        prepend-icon="mdi-chevron-left"
        @click="step--"
      >
        Back
      </v-btn>
      <v-spacer />
      <v-btn
        v-if="step < 3"
        color="primary"
        variant="flat"
        append-icon="mdi-chevron-right"
        :disabled="!canGoNext"
        @click="step++"
      >
        Next
      </v-btn>
      <v-btn
        v-if="step === 3"
        color="success"
        variant="flat"
        prepend-icon="mdi-auto-fix"
        :loading="generating"
        :disabled="!canGoNext"
        @click="generateAndSave"
      >
        Generate & Save
      </v-btn>
    </v-card-actions>

    <v-overlay v-model="generating" persistent class="align-center justify-center">
      <v-card class="pa-8 text-center" rounded="xl" elevation="12">
        <v-progress-circular indeterminate size="64" color="primary" class="mb-4" />
        <div class="text-h6">AI is thinking...</div>
        <div class="text-caption text-medium-emphasis">This may take some time</div>
      </v-card>
    </v-overlay>

    <v-snackbar v-model="errorShow" color="error" timeout="5000">
      {{ errorMessage }}
    </v-snackbar>
  </v-card>
</template>

<script setup lang="ts">
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

const generating = ref(false)
const errorShow = ref(false)
const errorMessage = ref('')

// Menu state for autocomplete dropdowns
const notesMenuOpen = ref(false)
const pagesMenuOpen = ref(false)
const personsMenuOpen = ref(false)
const libraryMenuOpen = ref(false)

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

// Handler functions for "Select All" with auto-close
function selectAllNotes() {
  selectedNotes.value = [...allNotes.value]
  notesMenuOpen.value = false
}

function selectAllPages() {
  selectedPages.value = allPages.value.map(p => p.name)
  pagesMenuOpen.value = false
}

function selectAllPersons() {
  selectedPersons.value = allPersons.value.map(p => p.name)
  personsMenuOpen.value = false
}

function selectAllLibrary() {
  selectedLibrary.value = allLibrary.value.map(l => l.name)
  libraryMenuOpen.value = false
}

async function generateAndSave() {
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
    
    // Emit the created event with the slug to navigate to the entry
    emit('created', res.slug)
  } catch (err: any) {
    errorMessage.value = err.data?.statusMessage || 'Failed to generate content'
    errorShow.value = true
  } finally {
    generating.value = false
  }
}
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
/* ── Library Creator Card Layout ──────────────────────────────────────── */
.library-creator-card {
  max-height: 85vh;
}

.library-creator-window {
  overflow-y: auto;
}

/* ── Autocomplete Container ───────────────────────────────────────────── */
.autocomplete-container {
  padding: 24px 16px 8px 16px !important;
}

.autocomplete-container :deep(.v-input) {
  margin-top: 4px;
}

.autocomplete-container :deep(.v-field) {
  margin-top: 0;
}

/* ── Toolbar Close Button (Default Theme) ─────────────────────────────── */
.v-toolbar .toolbar-close-btn {
  color: white;
  opacity: 1;
}

.v-toolbar .toolbar-close-btn :deep(.v-icon) {
  color: white;
  opacity: 1;
}

/* ── Utility Classes ──────────────────────────────────────────────────── */
.max-w-md { 
  max-width: 500px; 
}

.max-w-lg { 
  max-width: 800px; 
}

.gap-2 { 
  gap: 8px; 
}

/* ── Markdown Preview Styling ─────────────────────────────────────────── */
.markdown-preview :deep(h1) { 
  font-size: 1.5rem; 
  margin-bottom: 1rem; 
  border-bottom: 1px solid rgba(255,255,255,0.1); 
  padding-bottom: 0.5rem; 
}

.markdown-preview :deep(h2) { 
  font-size: 1.25rem; 
  margin-top: 1.5rem; 
  margin-bottom: 0.75rem; 
}

.markdown-preview :deep(p) { 
  margin-bottom: 1rem; 
  line-height: 1.6; 
}
.markdown-preview :deep(ul), .markdown-preview :deep(ol) { margin-bottom: 1rem; padding-left: 1.5rem; }
.markdown-preview :deep(li) { margin-bottom: 0.25rem; }
</style>
