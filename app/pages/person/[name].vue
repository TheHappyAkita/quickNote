<template>
  <v-container fluid class="pa-4 pa-sm-6">
    <div class="d-flex align-center mb-4">
      <v-btn icon variant="text" size="small" class="mr-2" to="/persons">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-icon color="pink" class="mr-2">mdi-account</v-icon>
      <h1 class="text-h6 font-weight-bold">{{ personName }}</h1>
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
        title="Delete person page"
        @click="deleteDialog = true"
      />
    </div>

    <NoteEditor v-model="content" @blur="saveNow" />

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Delete Person?</v-card-title>
        <v-card-text>
          Delete notes for "{{ personName }}"? This cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="doDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const personName = computed(() => decodeURIComponent(route.params.name as string))

useHead({ title: computed(() => personName.value) })

const { data: personData } = await useFetch<{ name: string; content: string }>(
  () => `/api/persons/${encodeURIComponent(personName.value)}`,
  {
    watch: [personName],
    server: false,
    default: () => ({ name: personName.value, content: '' }),
  },
)

const content = ref('')
const saving = ref(false)
const saved = ref(false)
const deleteDialog = ref(false)

watch(() => personData.value?.content, (c) => {
  if (c !== undefined) content.value = c
}, { immediate: true })

async function saveNow() {
  if (saving.value) return
  saving.value = true
  saved.value = false
  try {
    const res = await $fetch<{ ok: boolean; deleted?: boolean }>(
      `/api/persons/${encodeURIComponent(personName.value)}`,
      { method: 'PUT' as 'GET', body: { content: content.value } },
    )
    if (res.deleted) {
      router.push('/persons')
      return
    }
    saved.value = true
    setTimeout(() => (saved.value = false), 2000)
  } catch (err) {
    console.error('Failed to save person:', err)
  } finally {
    saving.value = false
  }
}

async function doDelete() {
  await $fetch(`/api/persons/${encodeURIComponent(personName.value)}`, { method: 'DELETE' as 'GET' })
  deleteDialog.value = false
  router.push('/persons')
}

onMounted(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveNow() }
  }
  document.addEventListener('keydown', handler)
  onUnmounted(() => document.removeEventListener('keydown', handler))
})
</script>
