<!-- Copyright (C) 2026 TheHappyAkita - SPDX-License-Identifier: GPL-3.0-only -->
<template>
  <v-container v-if="pending" fluid class="d-flex justify-center align-center h-100">
    <v-progress-circular indeterminate color="primary" />
  </v-container>

  <v-container v-else-if="error" fluid class="pa-4 pa-sm-6">
    <v-alert type="error" variant="tonal" title="Library Entry Not Found">
      The library entry "{{ $route.params.name }}" could not be loaded.
      <template #append>
        <v-btn to="/library" variant="text">Back to Library</v-btn>
      </template>
    </v-alert>
  </v-container>

  <v-container v-else-if="entryData" fluid class="pa-4 pa-sm-6">
    <div class="editor-page">
      <div class="d-flex align-center mb-4">
        <v-btn icon variant="text" size="small" class="mr-2" to="/library">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        <v-icon color="primary" class="mr-2">mdi-book-open-variant</v-icon>
        <h1 class="text-h6 font-weight-bold">{{ entryData.name }}</h1>
        <v-spacer />
        <v-btn
          icon="mdi-content-save"
          variant="text"
          size="small"
          :color="saveStatus === 'saved' ? 'success' : 'primary'"
          :loading="saveStatus === 'saving'"
          title="Save"
          @click="saveEntry"
        />
        <v-btn
          icon="mdi-delete"
          variant="text"
          size="small"
          color="error"
          class="ml-2"
          title="Delete entry"
          @click="showDelete = true"
        />
      </div>

      <NoteEditor
        v-model="content"
        :page-name="entryData.name"
        @update:modelValue="debouncedSave"
      />
    </div>

    <!-- Delete Confirmation -->
    <v-dialog v-model="showDelete" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Delete Entry?</v-card-title>
        <v-card-text>
          Are you sure you want to delete "<strong>{{ entryData.name }}</strong>"? This cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDelete = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" :loading="deleting" @click="confirmDelete">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.editor-page {
  height: calc(100vh - var(--v-layout-top, 64px) - 48px);
  display: flex;
  flex-direction: column;
}
</style>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const name = computed(() => decodeURIComponent(route.params.name as string))

useHead({
  title: computed(() => name.value || 'Library Entry'),
})

const { data: entryData, pending, error } = await useFetch<{ name: string; content: string; slug: string }>(
  () => `/api/library/${encodeURIComponent(name.value)}`,
  {
    watch: [name],
    server: false,
    default: () => ({ name: name.value, content: '', slug: '' }),
  },
)

const content = ref('')
const showDelete = ref(false)
const deleting = ref(false)
const saveStatus = ref<'idle' | 'saving' | 'saved'>('idle')

// Load content when data changes
watch(() => entryData.value?.content, (newContent) => {
  if (newContent !== undefined) {
    content.value = newContent
  }
}, { immediate: true })

const debugState = computed(() => JSON.stringify({
  routeName: route.params.name,
  decodedName: name.value,
  pending: pending.value,
  error: error.value ? String(error.value) : null,
  data: entryData.value,
  contentLength: content.value.length,
  contentPreview: content.value.slice(0, 120),
}, null, 2))

let saveTimeout: any = null
function debouncedSave() {
  saveStatus.value = 'idle'
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(saveEntry, 1000)
}

async function saveEntry() {
  if (!entryData.value?.slug) return
  saveStatus.value = 'saving'
  try {
    await $fetch(`/api/library/${encodeURIComponent(entryData.value.slug)}`, {
      method: 'PUT' as 'GET',
      body: { content: content.value },
    })
    saveStatus.value = 'saved'
    setTimeout(() => { if (saveStatus.value === 'saved') saveStatus.value = 'idle' }, 2000)
  } catch (err) {
    console.error('Failed to save library entry:', err)
    saveStatus.value = 'idle'
  }
}

async function confirmDelete() {
  if (!entryData.value?.slug) return
  deleting.value = true
  try {
    await $fetch(`/api/library/${encodeURIComponent(entryData.value.slug)}`, {
      method: 'DELETE',
    })
    await router.push('/library')
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
