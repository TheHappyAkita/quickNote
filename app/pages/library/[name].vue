<!-- Copyright (C) 2026 TheHappyAkita - SPDX-License-Identifier: GPL-3.0-only -->
<template>
  <div v-if="pending" class="d-flex justify-center align-center h-100">
    <v-progress-circular indeterminate color="primary" />
  </div>

  <div v-else-if="error" class="pa-6">
    <v-alert type="error" variant="tonal" title="Library Entry Not Found">
      The library entry "{{ $route.params.name }}" could not be loaded.
      <template #append>
        <v-btn to="/library" variant="text">Back to Library</v-btn>
      </template>
    </v-alert>
  </div>

  <div v-else-if="data" class="h-100 d-flex flex-column overflow-hidden">
    <v-toolbar density="compact" color="surface" elevation="0" border="b">
      <v-btn icon="mdi-arrow-left" variant="text" to="/library" />
      <v-toolbar-title class="text-subtitle-1 font-weight-bold">
        {{ data.name }}
      </v-toolbar-title>
      <v-spacer />
      
      <v-chip
        v-if="saveStatus === 'saving'"
        size="x-small"
        color="info"
        variant="tonal"
        class="mr-2"
        prepend-icon="mdi-sync"
      >
        Saving...
      </v-chip>
      <v-chip
        v-else-if="saveStatus === 'saved'"
        size="x-small"
        color="success"
        variant="tonal"
        class="mr-2"
        prepend-icon="mdi-check"
      >
        Saved
      </v-chip>

      <v-btn
        icon="mdi-delete-outline"
        variant="text"
        size="small"
        color="error"
        title="Delete entry"
        @click="showDelete = true"
      />
    </v-toolbar>

    <div class="flex-grow-1 overflow-hidden">
      <NoteEditor
        v-model="data.content"
        :page-name="data.name"
        @update:modelValue="debouncedSave"
      />
    </div>

    <!-- Delete Confirmation -->
    <v-dialog v-model="showDelete" width="auto">
      <v-card rounded="xl" class="pa-2">
        <v-card-title class="text-h6">Delete Entry?</v-card-title>
        <v-card-text>
          Are you sure you want to delete "<strong>{{ data.name }}</strong>"? This cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" rounded="lg" @click="showDelete = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" rounded="lg" :loading="deleting" @click="confirmDelete">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const name = computed(() => route.params.name as string)

const { data, pending, error } = await useFetch<{ name: string; content: string; slug: string }>(
  () => `/api/library/${encodeURIComponent(name.value)}`,
)

const showDelete = ref(false)
const deleting = ref(false)
const saveStatus = ref<'idle' | 'saving' | 'saved'>('idle')

let saveTimeout: any = null
function debouncedSave() {
  saveStatus.value = 'idle'
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(saveEntry, 1000)
}

async function saveEntry() {
  if (!data.value) return
  saveStatus.value = 'saving'
  try {
    // We reuse the library creation/update logic by posting to index or a dedicated save route if we had one.
    // For now, let's assume we can use the library POST if it handles overwrite, 
    // but looking at our POST implementation it always adds a timestamp if it exists.
    // We need a PUT route or a proper save route. Let's create a PUT route.
    await $fetch(`/api/library/${encodeURIComponent(data.value.slug)}`, {
      method: 'PUT' as 'GET', // Nuxt 4 $fetch workaround for some environments or explicit cast
      body: { content: data.value.content }
    })
    saveStatus.value = 'saved'
    setTimeout(() => { if (saveStatus.value === 'saved') saveStatus.value = 'idle' }, 2000)
  } catch (err) {
    console.error('Failed to save library entry:', err)
    saveStatus.value = 'idle'
  }
}

async function confirmDelete() {
  if (!data.value) return
  deleting.value = true
  try {
    await $fetch(`/api/library/${encodeURIComponent(data.value.slug)}`, {
      method: 'DELETE'
    })
    navigateTo('/library')
  } catch (err) {
    console.error('Failed to delete entry:', err)
  } finally {
    deleting.value = false
    showDelete.value = false
  }
}

onUnmounted(() => {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
    saveEntry()
  }
})
</script>
