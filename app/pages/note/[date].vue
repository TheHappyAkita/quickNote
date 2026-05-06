<template>
  <v-container fluid class="pa-4 pa-sm-6">
    <div class="d-flex align-center mb-4 gap-2">
      <v-btn
        :to="prevDate ? `/note/${prevDate}` : undefined"
        :disabled="!prevDate"
        icon="mdi-chevron-left"
        variant="text"
        size="small"
      />

      <div class="text-h6 text-primary font-weight-bold flex-grow-1 text-center">
        {{ date }}
        <span class="text-caption text-medium-emphasis ml-2">{{ dayOfWeek }}</span>
      </div>

      <v-btn
        :to="nextDate ? `/note/${nextDate}` : undefined"
        :disabled="!nextDate"
        icon="mdi-chevron-right"
        variant="text"
        size="small"
      />

      <v-chip
        v-if="saveStatus"
        :color="saveStatus === 'saved' ? 'success' : 'primary'"
        size="small"
        variant="tonal"
        class="ml-2"
      >
        {{ saveStatus === 'saving' ? 'Saving…' : 'Saved' }}
      </v-chip>

      <v-btn
        icon="mdi-content-save"
        variant="text"
        size="small"
        :color="saveStatus === 'saved' ? 'success' : 'primary'"
        :loading="saveStatus === 'saving'"
        title="Save (Ctrl+S)"
        @click="saveNow"
      />
    </div>

    <NoteEditor v-model="content" :date="date" @blur="saveNow" />
  </v-container>
</template>

<script setup lang="ts">
const route = useRoute()
const date = computed(() => route.params.date as string)

useHead({
  title: date.value,
})

const dayOfWeek = computed(() => {
  const d = new Date(date.value + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
})

const { data: noteData, refresh } = await useFetch<{ date: string; content: string }>(
  () => `/api/notes/${date.value}` as string,
  { watch: [date] }
)
const { data: allDates } = await useFetch<string[]>('/api/notes')

const content = ref(noteData.value?.content ?? '')
const saveStatus = ref<'saving' | 'saved' | null>(null)
const isDirty = ref(false)
let saveInterval: ReturnType<typeof setInterval> | null = null

watch(
  () => noteData.value,
  (val) => {
    content.value = val?.content ?? ''
    isDirty.value = false
  }
)

watch(content, () => { isDirty.value = true })

const currentIndex = computed(() => allDates.value?.indexOf(date.value) ?? -1)
const prevDate = computed(() =>
  currentIndex.value > 0 ? (allDates.value?.[currentIndex.value - 1] ?? null) : null
)
const nextDate = computed(() =>
  currentIndex.value < (allDates.value?.length ?? 0) - 1
    ? (allDates.value?.[currentIndex.value + 1] ?? null)
    : null
)

async function saveNow() {
  if (!isDirty.value) return
  saveStatus.value = 'saving'
  try {
    await $fetch(`/api/notes/${date.value}` as string, {
      method: 'PUT' as 'GET',
      body: { content: content.value },
    })
    isDirty.value = false
    if (!allDates.value?.includes(date.value)) {
      await refresh()
    }
    saveStatus.value = 'saved'
    setTimeout(() => { saveStatus.value = null }, 2000)
  } catch {
    saveStatus.value = null
  }
}

onMounted(() => {
  saveInterval = setInterval(saveNow, 10_000)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  if (saveInterval) clearInterval(saveInterval)
  document.removeEventListener('keydown', handleKeydown)
  saveNow()
})

function handleKeydown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault()
    saveNow()
  }
}
</script>
