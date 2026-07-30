<!-- Copyright (C) 2026 TheHappyAkita - SPDX-License-Identifier: GPL-3.0-only -->
<template>
  <v-container fluid class="pa-4 pa-sm-6">
    <div class="d-flex align-center mb-4">
      <v-icon color="primary" class="mr-2">mdi-library-shelves</v-icon>
      <h1 class="text-h6 font-weight-bold">Library</h1>
      <v-spacer />
      <v-chip size="small" variant="tonal" color="primary">
        {{ filteredEntries.length }} / {{ entries?.length ?? 0 }} entries
      </v-chip>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        class="ml-4"
        @click="showCreator = true"
      >
        New Entry
      </v-btn>
    </div>

    <!-- Search -->
    <v-text-field
      v-model="search"
      prepend-inner-icon="mdi-magnify"
      placeholder="Search library…"
      variant="outlined"
      density="compact"
      hide-details
      clearable
      class="mb-4"
    />

    <!-- List -->
    <v-progress-circular v-if="pending" indeterminate color="primary" class="d-flex mx-auto" />

    <v-alert v-else-if="!entries?.length" type="info" variant="tonal" class="mb-4">
      No library entries yet. Create one to summarize your knowledge using AI!
    </v-alert>

    <v-row v-else dense>
      <v-col
        v-for="entry in filteredEntries"
        :key="entry.slug"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card
          variant="outlined"
          class="entry-card"
          hover
          density="compact"
          :to="`/library/${encodeURIComponent(entry.slug)}`"
        >
          <v-card-item class="py-2 px-3">
            <template #prepend>
              <v-icon color="primary" size="20">mdi-book-open-variant</v-icon>
            </template>
            <v-card-title class="text-subtitle-2 font-weight-bold text-truncate">
              {{ entry.name }}
            </v-card-title>
          </v-card-item>
          <v-card-text v-if="entry.tags.length > 0" class="pt-0 pb-2 px-3">
            <v-chip
              v-for="tag in entry.tags"
              :key="tag"
              size="x-small"
              variant="tonal"
              color="primary"
              class="mr-1"
            >
              #{{ tag }}
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Creator Wizard Dialog -->
    <v-dialog 
      v-model="showCreator" 
      max-width="900" 
      persistent
      scrollable
    >
      <LibraryCreator @close="showCreator = false" @created="onCreated" />
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import type { LibraryMeta } from '#shared/types/notes'

useHead({ title: 'Library' })

const { data: entries, pending, refresh } = await useFetch<LibraryMeta[]>('/api/library', {
  server: false,
  default: () => [],
})

const showCreator = ref(false)
const search = ref('')

const filteredEntries = computed(() => {
  if (!search.value.trim()) return entries.value
  const q = search.value.trim().toLowerCase()
  return (entries.value ?? []).filter(e => 
    e.name.toLowerCase().includes(q) || 
    e.tags.some(t => t.toLowerCase().includes(q))
  )
})

function onCreated(slug: string) {
  showCreator.value = false
  refresh()
  navigateTo(`/library/${encodeURIComponent(slug)}`)
}
</script>

<style scoped>
.entry-card {
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s;
}
.entry-card:hover {
  transform: translateY(-2px);
  border-color: #6C63FF;
}
</style>
