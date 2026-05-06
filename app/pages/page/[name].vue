<template>
  <v-container fluid class="pa-4 pa-sm-6">
    <div class="d-flex align-center mb-4">
      <v-btn icon variant="text" size="small" class="mr-2" to="/pages">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-icon color="secondary" class="mr-2">mdi-file-document-outline</v-icon>
      <h1 class="text-h6 font-weight-bold">{{ pageName }}</h1>
      <v-spacer />
      <v-btn
        icon="mdi-content-save"
        variant="text"
        size="small"
        :color="saved ? 'success' : 'primary'"
        :loading="saving"
        title="Save (Ctrl+S)"
        @click="saveNow"
      />
      <v-btn
        icon="mdi-delete"
        variant="text"
        size="small"
        color="error"
        class="ml-2"
        title="Delete page"
        @click="confirmDelete"
      />
    </div>

    <NoteEditor v-model="content" :page-name="pageName" @blur="saveNow" />

    <!-- Delete confirmation dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Delete Page?</v-card-title>
        <v-card-text>
          Are you sure you want to delete "{{ pageName }}"? This cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="deletePage">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const pageName = computed(() => route.params.name as string)

useHead({
  title: pageName.value,
})

const { data: pageData, refresh } = await useFetch<{ name: string; content: string }>(
  () => `/api/pages/${pageName.value}` as string,
  {
    watch: [pageName],
    server: false,
    default: () => ({ name: pageName.value, content: '' }),
  }
)

const content = ref('')
const saving = ref(false)
const saved = ref(false)
const deleteDialog = ref(false)

// Load content when data changes
watch(() => pageData.value?.content, (newContent) => {
  if (newContent !== undefined) {
    content.value = newContent
  }
}, { immediate: true })

async function saveNow() {
  if (saving.value) return
  saving.value = true
  saved.value = false
  try {
    await $fetch(`/api/pages/${pageName.value}`, {
      method: 'POST',
      body: { content: content.value },
    })
    saved.value = true
    setTimeout(() => (saved.value = false), 2000)
  } catch (err) {
    console.error('Failed to save page:', err)
  } finally {
    saving.value = false
  }
}

function confirmDelete() {
  deleteDialog.value = true
}

async function deletePage() {
  try {
    await $fetch(`/api/pages/${pageName.value}`, {
      method: 'DELETE',
    })
    deleteDialog.value = false
    router.push('/pages')
  } catch (err) {
    console.error('Failed to delete page:', err)
  }
}

// Ctrl+S shortcut
useEventListener('keydown', (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    saveNow()
  }
})
</script>
