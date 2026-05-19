<template>
  <v-container fluid class="pa-4 pa-sm-6">
    <div class="editor-page">
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

    <!-- Tags row -->
    <div class="d-flex flex-wrap align-center gap-1 mb-3">
      <v-chip
        v-for="tag in currentTags"
        :key="tag"
        size="small"
        variant="tonal"
        color="secondary"
        closable
        @click:close="removeTag(tag)"
      >
        #{{ tag }}
      </v-chip>
      <v-text-field
        v-if="addingTag"
        ref="tagInputRef"
        v-model="newTag"
        density="compact"
        variant="outlined"
        hide-details
        placeholder="tag name"
        class="tag-input"
        @keyup.enter="confirmAddTag"
        @keyup.escape="addingTag = false; newTag = ''"
        @blur="confirmAddTag"
      />
      <v-btn
        v-else
        size="x-small"
        variant="text"
        color="secondary"
        prepend-icon="mdi-tag-plus"
        @click="startAddTag"
      >
        Add tag
      </v-btn>
    </div>

    <NoteEditor v-model="content" :page-name="pageName" @blur="saveNow" />
    </div>
  </v-container>

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

// ─── Tags ─────────────────────────────────────────────────────────
const addingTag = ref(false)
const newTag = ref('')
const tagInputRef = ref<{ focus: () => void } | null>(null)

// Parse frontmatter tags from the current content
const currentTags = computed(() => {
  const c = content.value
  if (!c) return []
  // Parse frontmatter tags: [t1, t2]
  if (c.startsWith('---')) {
    const end = c.indexOf('\n---', 3)
    if (end !== -1) {
      const fm = c.slice(3, end)
      const inline = /^tags:\s*\[([^\]]*)\]/m.exec(fm)
      if (inline) {
        return (inline[1] ?? '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
      }
      const block = /^tags:\s*\n((?:[ \t]*-[ \t]+[^\n]+\n?)*)/m.exec(fm)
      if (block) {
        return (block[1] ?? '').split('\n')
          .map(l => l.replace(/^[ \t]*-[ \t]+/, '').trim().toLowerCase())
          .filter(Boolean)
      }
    }
  }
  return []
})

function applyTagsToContent(tags: string[]) {
  const tagLine = tags.length > 0 ? `tags: [${tags.join(', ')}]` : null
  const c = content.value
  if (c.startsWith('---')) {
    const end = c.indexOf('\n---', 3)
    if (end !== -1) {
      const fm = c.slice(3, end).replace(/\ntags:[^\n]*(\n[ \t]+-[^\n]*)*/g, '')
      const rest = c.slice(end + 4)
      const cleaned = fm.trimEnd()
      if (tagLine) {
        content.value = `---\n${cleaned ? cleaned + '\n' : ''}${tagLine}\n---${rest}`
      } else if (cleaned) {
        content.value = `---\n${cleaned}\n---${rest}`
      } else {
        content.value = rest.trimStart()
      }
      return
    }
  }
  if (tagLine) content.value = `---\n${tagLine}\n---\n${c}`
}

function removeTag(tag: string) {
  const updated = currentTags.value.filter(t => t !== tag)
  applyTagsToContent(updated)
  saveNow()
}

function startAddTag() {
  addingTag.value = true
  nextTick(() => (tagInputRef.value as any)?.focus?.())
}

function confirmAddTag() {
  const tag = newTag.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
  if (tag && !currentTags.value.includes(tag)) {
    applyTagsToContent([...currentTags.value, tag].sort())
    saveNow()
  }
  newTag.value = ''
  addingTag.value = false
}

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
onMounted(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      saveNow()
    }
  }
  document.addEventListener('keydown', handler)
  onUnmounted(() => {
    document.removeEventListener('keydown', handler)
  })
})
</script>

<style scoped>
.editor-page {
  height: calc(100vh - var(--v-layout-top, 64px) - 48px);
  display: flex;
  flex-direction: column;
}

.gap-1 {
  gap: 4px;
}
.tag-input {
  max-width: 120px;
}
</style>
