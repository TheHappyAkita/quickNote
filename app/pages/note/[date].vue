<template>
  <v-container fluid class="pa-4 pa-sm-6">
    <div class="d-flex align-center mb-4 gap-2">
      <!-- Prev (older) -->
      <v-btn
        :to="prevDate ? `/note/${prevDate}` : undefined"
        :disabled="!prevDate"
        icon="mdi-chevron-left"
        variant="text"
        size="small"
        title="Previous note"
      />

      <!-- Date display -->
      <div class="text-h6 text-primary font-weight-bold flex-grow-1 text-center">
        {{ date }}
        <span class="text-caption text-medium-emphasis ml-2">{{ dayOfWeek }}</span>
      </div>

      <!-- Next (newer) -->
      <v-btn
        :to="nextDate ? `/note/${nextDate}` : undefined"
        :disabled="!nextDate"
        icon="mdi-chevron-right"
        variant="text"
        size="small"
        title="Next note"
      />

      <v-divider vertical class="mx-1" style="height:24px; align-self:center" />

      <!-- Jump to today -->
      <v-btn
        :to="isToday ? undefined : `/note/${today}`"
        :disabled="isToday"
        icon="mdi-calendar-today"
        variant="text"
        size="small"
        :color="isToday ? 'success' : 'primary'"
        title="Go to today"
      />

      <!-- Date picker -->
      <div style="position: relative; display: inline-flex;">
        <v-btn
          icon="mdi-calendar-search"
          variant="text"
          size="small"
          title="Jump to date"
          @click="openDatePicker"
        />
        <input
          ref="dateInputRef"
          type="date"
          class="hidden-date-input"
          :value="date"
          @change="onDatePicked"
        />
      </div>

      <v-divider vertical class="mx-1" style="height:24px; align-self:center" />

      <v-chip
        v-if="saveStatus"
        :color="saveStatus === 'saved' ? 'success' : 'primary'"
        size="small"
        variant="tonal"
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
const router = useRouter()
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

const today = new Date().toISOString().split('T')[0]!
const isToday = computed(() => date.value === today)

const currentIndex = computed(() => allDates.value?.indexOf(date.value) ?? -1)

// When the current date is not yet saved (index = -1), bisect allDates to find neighbours
const prevDate = computed(() => {
  const dates = allDates.value ?? []
  if (currentIndex.value > 0) return dates[currentIndex.value - 1] ?? null
  if (currentIndex.value === -1) {
    const before = dates.filter(d => d < date.value)
    return before.length ? (before[before.length - 1] ?? null) : null
  }
  return null
})
const nextDate = computed(() => {
  const dates = allDates.value ?? []
  if (currentIndex.value !== -1 && currentIndex.value < dates.length - 1)
    return dates[currentIndex.value + 1] ?? null
  if (currentIndex.value === -1) {
    const after = dates.filter(d => d > date.value)
    return after.length ? (after[0] ?? null) : null
  }
  return null
})

const dateInputRef = ref<HTMLInputElement | null>(null)

function openDatePicker() {
  dateInputRef.value?.showPicker()
}

async function onDatePicked(e: Event) {
  const picked = (e.target as HTMLInputElement).value
  if (picked && picked !== date.value) {
    await saveNow()
    router.push(`/note/${picked}`)
  }
}

async function saveNow() {
  if (!isDirty.value) return
  saveStatus.value = 'saving'
  try {
    const res = await $fetch<{ ok: boolean; deleted?: boolean }>(`/api/notes/${date.value}` as string, {
      method: 'PUT' as 'GET',
      body: { content: content.value },
    })
    isDirty.value = false
    if (res.deleted) {
      await refresh()
      router.push(`/note/${today}`)
      return
    }
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

<style scoped>
.hidden-date-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
  width: 100%;
  height: 100%;
}
</style>
