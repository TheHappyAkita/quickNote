<!-- Copyright (C) 2026 TheHappyAkita - SPDX-License-Identifier: GPL-3.0-only -->
<template>
  <v-container fluid class="pa-4 pa-sm-6">
    <div class="d-flex align-center mb-4">
      <v-icon color="secondary" class="mr-2">mdi-file-document-multiple</v-icon>
      <h1 class="text-h6 font-weight-bold">Pages</h1>
      <v-spacer />
      <v-chip size="small" variant="tonal" color="secondary">
        {{ filteredPages.length }} / {{ pages?.length ?? 0 }} pages
      </v-chip>
    </div>

    <!-- Create new page -->
    <v-card class="mb-4" variant="outlined">
      <v-card-text class="pa-3">
        <v-form @submit.prevent="createPage">
          <v-text-field
            v-model="newPageName"
            label="New page name"
            placeholder="e.g., Project Ideas, Meeting Notes, Book List"
            variant="outlined"
            density="compact"
            hide-details
            class="mb-2"
            :rules="[nameRules.valid]"
            @keyup.enter="createPage"
          >
            <template #append>
              <v-btn
                color="primary"
                variant="flat"
                size="small"
                :disabled="!isValidName"
                :loading="creating"
                @click="createPage"
              >
                Create
              </v-btn>
            </template>
          </v-text-field>
          <div class="text-caption text-medium-emphasis">
            Use letters, numbers, spaces, hyphens, and underscores
          </div>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Tag filter chips -->
    <div v-if="allTags.length > 0" class="mb-4 d-flex flex-wrap gap-2 align-center">
      <v-icon size="16" color="secondary" class="mr-1">mdi-tag-multiple</v-icon>
      <v-chip
        v-for="tag in allTags"
        :key="tag"
        size="small"
        :variant="selectedTags.has(tag) ? 'flat' : 'tonal'"
        :color="selectedTags.has(tag) ? 'secondary' : undefined"
        class="cursor-pointer"
        @click="toggleTag(tag)"
      >
        #{{ tag }}
      </v-chip>
      <v-btn
        v-if="selectedTags.size > 0"
        size="x-small"
        variant="text"
        color="secondary"
        @click="selectedTags.clear()"
      >
        Clear filter
      </v-btn>
    </div>

    <!-- Pages list -->
    <v-progress-circular v-if="pending" indeterminate color="secondary" class="d-flex mx-auto" />

    <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
      Failed to load pages
    </v-alert>

    <v-alert v-else-if="!pages?.length" type="info" variant="tonal">
      No pages yet. Create your first page above!
    </v-alert>

    <v-alert v-else-if="filteredPages.length === 0" type="info" variant="tonal">
      No pages match the selected tags.
    </v-alert>

    <v-row v-else dense>
      <v-col
        v-for="page in filteredPages"
        :key="page.name"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card
          variant="outlined"
          class="page-card"
          hover
          :to="`/page/${encodeURIComponent(page.name)}`"
        >
          <v-card-item>
            <template #prepend>
              <v-icon color="secondary">mdi-file-document-outline</v-icon>
            </template>
            <v-card-title class="text-body-1 text-truncate">
              {{ page.name }}
            </v-card-title>
          </v-card-item>
          <v-card-text v-if="page.tags.length > 0" class="pt-0 pb-2 px-3">
            <v-chip
              v-for="tag in page.tags"
              :key="tag"
              size="x-small"
              variant="tonal"
              color="secondary"
              class="mr-1"
              @click.prevent="toggleTag(tag)"
            >
              #{{ tag }}
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import type { NotePageMeta } from '#shared/types/notes'

useHead({
  title: 'Pages',
})

const { data: pages, pending, error, refresh } = await useFetch<NotePageMeta[]>('/api/pages', {
  server: false,
  default: () => [],
})

const newPageName = ref('')
const creating = ref(false)
const selectedTags = reactive(new Set<string>())

const sortedPages = computed(() => {
  return [...(pages.value ?? [])].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
})

const allTags = computed(() => {
  const tags = new Set<string>()
  for (const p of sortedPages.value) {
    for (const t of p.tags) tags.add(t)
  }
  return [...tags].sort()
})

const filteredPages = computed(() => {
  if (selectedTags.size === 0) return sortedPages.value
  return sortedPages.value.filter(p => [...selectedTags].every(t => p.tags.includes(t)))
})

function toggleTag(tag: string) {
  if (selectedTags.has(tag)) selectedTags.delete(tag)
  else selectedTags.add(tag)
}

const nameRules = {
  valid: (v: string) => {
    if (!v) return 'Name is required'
    if (!/^[a-zA-Z0-9_\- ]+$/.test(v)) return 'Invalid characters'
    if (v.length > 100) return 'Too long (max 100)'
    return true
  },
}

const isValidName = computed(() => {
  const v = newPageName.value.trim()
  return v && /^[a-zA-Z0-9_\- ]+$/.test(v) && v.length <= 100
})

async function createPage() {
  const name = newPageName.value.trim()
  if (!isValidName.value) return

  creating.value = true
  try {
    await $fetch(`/api/pages/${name}`, {
      method: 'POST',
      body: { content: '' },
    })
    newPageName.value = ''
    await refresh()
    await navigateTo(`/page/${encodeURIComponent(name)}`)
  } catch (err) {
    console.error('Failed to create page:', err)
  } finally {
    creating.value = false
  }
}
</script>

<style scoped>
.page-card {
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s;
}
.page-card:hover {
  transform: translateY(-2px);
  border-color: #6c63ff;
}
.gap-2 {
  gap: 8px;
}
.cursor-pointer {
  cursor: pointer;
}
</style>
