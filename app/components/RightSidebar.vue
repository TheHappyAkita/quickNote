<template>
  <div class="sidebar" :class="{ collapsed: activePanel === null }">
    <!-- Button strip (always visible) -->
    <div class="sidebar-strip">
      <!-- Alerts bell (only when alerts exist) -->
      <v-btn
        v-if="alertCount > 0"
        icon
        size="small"
        variant="text"
        class="strip-btn"
        :color="activePanel === 'alerts' ? 'error' : undefined"
        :title="`Alerts (${alertCount})`"
        @click="toggle('alerts')"
      >
        <v-badge :content="alertCount" color="error" offset-x="4" offset-y="-4">
          <v-icon color="error">mdi-bell-alert</v-icon>
        </v-badge>
      </v-btn>

      <!-- Reminders bell (only when reminders exist) -->
      <v-btn
        v-if="regularCount > 0"
        icon
        size="small"
        variant="text"
        class="strip-btn"
        :color="activePanel === 'reminders' ? 'warning' : undefined"
        :title="`Reminders (${regularCount})`"
        @click="toggle('reminders')"
      >
        <v-badge :content="regularCount" color="warning" offset-x="4" offset-y="-4">
          <v-icon color="warning">mdi-bell-outline</v-icon>
        </v-badge>
      </v-btn>

      <!-- ToDos (only when exist) -->
      <v-btn
        v-if="todoCount > 0"
        icon
        size="small"
        variant="text"
        class="strip-btn"
        :color="activePanel === 'todos' ? 'white' : undefined"
        :title="`To-Do (${todoCount})`"
        @click="toggle('todos')"
      >
        <v-badge :content="todoCount" color="grey" offset-x="4" offset-y="-4">
          <v-icon :color="activePanel === 'todos' ? 'white' : 'grey-lighten-1'">mdi-format-list-checks</v-icon>
        </v-badge>
      </v-btn>

      <!-- Search -->
      <v-btn
        icon
        size="small"
        variant="text"
        class="strip-btn"
        :color="activePanel === 'search' ? 'primary' : undefined"
        title="Search"
        @click="toggle('search')"
      >
        <v-icon>mdi-magnify</v-icon>
      </v-btn>

      <!-- Spacer pushes close button to bottom -->
      <div class="strip-spacer" />

      <!-- Collapse / chevron (bottom) -->
      <v-btn
        v-if="activePanel !== null"
        icon
        size="small"
        variant="text"
        class="strip-btn"
        title="Close panel"
        @click="activePanel = null"
      >
        <v-icon>mdi-chevron-right</v-icon>
      </v-btn>
    </div>

    <!-- Panel content -->
    <div v-if="activePanel !== null" class="sidebar-panel">

      <!-- Search panel -->
      <template v-if="activePanel === 'search'">
        <div class="panel-header">
          <v-icon size="18" color="primary" class="mr-2">mdi-magnify</v-icon>
          <span class="font-weight-bold">Search</span>
        </div>
        <v-text-field
          v-model="searchQuery"
          placeholder="Search notes and pages..."
          variant="outlined"
          density="compact"
          hide-details
          clearable
          class="search-input mb-3"
          @update:model-value="debouncedSearch"
          @keyup.enter="performSearch"
        />
        <div v-if="searchLoading" class="d-flex justify-center pa-4">
          <v-progress-circular indeterminate size="20" color="primary" />
        </div>
        <div v-else-if="searchQuery.length >= 2 && searchResults.length === 0" class="text-caption text-medium-emphasis pa-2 text-center">
          No results found
        </div>
        <div v-else-if="searchQuery.length < 2" class="text-caption text-medium-emphasis pa-2 text-center">
          Type at least 2 characters to search
        </div>
        <v-list v-else density="compact" class="result-list">
          <v-list-item
            v-for="result in searchResults"
            :key="`${result.type}-${result.id}`"
            :to="result.type === 'note' ? `/note/${result.id}` : result.type === 'location' ? `/location/${encodeURIComponent(result.id)}` : `/page/${encodeURIComponent(result.id)}`"
            class="result-item"
            @click="activePanel = null"
          >
            <template #prepend>
              <v-icon v-if="result.type === 'note'" size="16" color="primary">mdi-calendar</v-icon>
              <v-icon v-else-if="result.type === 'location'" size="16" color="teal">mdi-map-marker</v-icon>
              <v-icon v-else size="16" color="secondary">mdi-file-document-outline</v-icon>
            </template>
            <v-list-item-title class="text-body-2">
              {{ result.title }}
              <v-chip v-if="result.matches > 1" size="x-small" variant="tonal" color="info" class="ml-1">{{ result.matches }}</v-chip>
            </v-list-item-title>
            <v-list-item-subtitle class="text-caption excerpt" v-html="parseWikilinks(result.excerpt)"></v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </template>

      <!-- Alerts panel -->
      <template v-else-if="activePanel === 'alerts'">
        <div class="panel-header alert-header">
          <v-icon size="18" color="error" class="mr-2">mdi-bell-alert</v-icon>
          <span class="font-weight-bold text-error">Alerts</span>
          <v-spacer />
          <v-chip size="x-small" variant="tonal" color="error">{{ alertCount }}</v-chip>
        </div>
        <div v-if="remindersPending" class="d-flex justify-center pa-4">
          <v-progress-circular indeterminate size="20" color="error" />
        </div>
        <v-list v-else density="compact" class="reminder-list">
          <v-list-item
            v-for="reminder in alerts"
            :key="`${reminder.date}-${reminder.text}`"
            class="reminder-item alert-item"
          >
            <template #prepend>
              <v-icon size="14" color="error">mdi-bell-alert</v-icon>
            </template>
            <v-list-item-title class="text-body-2 reminder-text">
              <NuxtLink :to="`/note/${reminder.date}`" class="reminder-link" v-html="parseWikilinks(reminder.text)"></NuxtLink>
            </v-list-item-title>
            <v-list-item-subtitle class="text-caption">
              <v-icon size="12" color="error" class="mr-1">mdi-clock-alert</v-icon>
              <span :class="{ 'text-error font-weight-bold': isOverdue(reminder.alertDate!) }">
                {{ formatAlertDate(reminder.alertDate!) }}
              </span>
              <span class="text-medium-emphasis ml-1">(in {{ formatDate(reminder.date) }})</span>
            </v-list-item-subtitle>
            <template #append>
              <v-btn icon="mdi-check" size="x-small" variant="text" color="success" title="Dismiss" @click.prevent="dismiss(reminder)" />
            </template>
          </v-list-item>
        </v-list>
      </template>

      <!-- ToDos panel -->
      <template v-else-if="activePanel === 'todos'">
        <div class="panel-header">
          <v-icon size="18" color="grey-lighten-1" class="mr-2">mdi-format-list-checks</v-icon>
          <span class="font-weight-bold">To-Do</span>
          <v-spacer />
          <v-chip size="x-small" variant="tonal">{{ todoCount }}</v-chip>
        </div>
        <div v-if="remindersPending" class="d-flex justify-center pa-4">
          <v-progress-circular indeterminate size="20" />
        </div>
        <div v-else-if="todoCount === 0" class="text-caption text-medium-emphasis pa-3 text-center">
          No to-dos found.<br>
          <span class="text-xs">Use "Todo: text" in notes</span>
        </div>
        <v-list v-else density="compact" class="reminder-list">
          <v-list-item
            v-for="todo in todos"
            :key="`${todo.date}-${todo.text}`"
            class="reminder-item"
          >
            <template #prepend>
              <v-icon size="14" color="grey-lighten-2">mdi-checkbox-blank-outline</v-icon>
            </template>
            <v-list-item-title class="text-body-2 reminder-text">
              <NuxtLink :to="`/note/${todo.date}`" class="reminder-link" v-html="parseWikilinks(todo.text)"></NuxtLink>
            </v-list-item-title>
            <v-list-item-subtitle class="text-caption">{{ formatDate(todo.date) }}</v-list-item-subtitle>
            <template #append>
              <v-btn icon="mdi-check" size="x-small" variant="text" color="success" title="Mark done" @click.prevent="dismiss(todo)" />
            </template>
          </v-list-item>
        </v-list>
      </template>

      <!-- Reminders panel -->
      <template v-else-if="activePanel === 'reminders'">
        <div class="panel-header">
          <v-icon size="18" color="warning" class="mr-2">mdi-bell-outline</v-icon>
          <span class="font-weight-bold text-warning">Reminders</span>
          <v-spacer />
          <v-chip size="x-small" variant="tonal" color="warning">{{ regularCount }}</v-chip>
        </div>
        <div v-if="remindersPending" class="d-flex justify-center pa-4">
          <v-progress-circular indeterminate size="20" color="warning" />
        </div>
        <div v-else-if="regularCount === 0" class="text-caption text-medium-emphasis pa-3 text-center">
          No reminders found.<br>
          <span class="text-xs">Use "Remind: text" or "Reminder: text" in notes</span>
        </div>
        <v-list v-else density="compact" class="reminder-list">
          <v-list-item
            v-for="reminder in regularReminders"
            :key="`${reminder.date}-${reminder.text}`"
            class="reminder-item"
          >
            <template #prepend>
              <v-icon size="14" :color="iconColor(reminder.keyword)">{{ iconFor(reminder.keyword) }}</v-icon>
            </template>
            <v-list-item-title class="text-body-2 reminder-text">
              <NuxtLink :to="`/note/${reminder.date}`" class="reminder-link" v-html="parseWikilinks(reminder.text)"></NuxtLink>
            </v-list-item-title>
            <v-list-item-subtitle class="text-caption">{{ formatDate(reminder.date) }}</v-list-item-subtitle>
            <template #append>
              <v-btn icon="mdi-check" size="x-small" variant="text" color="success" title="Dismiss" @click.prevent="dismiss(reminder)" />
            </template>
          </v-list-item>
        </v-list>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import type { Reminder } from '#shared/types/notes'
import { useWikilinkParser } from '~/composables/useWikilinkParser'

type PanelName = 'search' | 'alerts' | 'reminders' | 'todos' | null
const activePanel = ref<PanelName>(null)

// ── Wikilink parser ─────────────────────────────────────────────────────
const { parseWikilinks } = useWikilinkParser()

// ── Reminders ──────────────────────────────────────────────────────
const { data: reminders, pending: remindersPending, refresh: refreshReminders } = await useFetch<Reminder[]>('/api/notes/reminders', {
  server: false,
  default: () => [],
})

const alerts = computed(() => reminders.value?.filter(r => r.keyword === 'alert') ?? [])
const regularReminders = computed(() => reminders.value?.filter(r => r.keyword !== 'alert' && r.keyword !== 'todo') ?? [])
const todos = computed(() => reminders.value?.filter(r => r.keyword === 'todo') ?? [])
const alertCount = computed(() => alerts.value.length)
const regularCount = computed(() => regularReminders.value.length)
const todoCount = computed(() => todos.value.length)

async function dismiss(reminder: Reminder) {
  await $fetch('/api/notes/reminders/dismiss', {
    method: 'POST' as 'POST',
    body: { date: reminder.date, text: reminder.text },
  })
  await refreshReminders()
}

let remindersInterval: ReturnType<typeof setInterval> | null = null
watch(activePanel, (panel) => {
  if (panel === 'alerts' || panel === 'reminders' || panel === 'todos') {
    refreshReminders()
    remindersInterval = setInterval(refreshReminders, 30_000)
  } else if (remindersInterval) {
    clearInterval(remindersInterval)
    remindersInterval = null
  }
})
onBeforeUnmount(() => {
  if (remindersInterval) clearInterval(remindersInterval)
})

function iconFor(keyword: Reminder['keyword']): string {
  switch (keyword) {
    case 'remind': return 'mdi-bell-outline'
    case 'remindme': return 'mdi-bell-ring'
    case 'reminder': return 'mdi-clock-alert-outline'
    default: return 'mdi-bell'
  }
}
function iconColor(keyword: Reminder['keyword']): string {
  switch (keyword) {
    case 'remindme': return 'error'
    case 'reminder': return 'info'
    default: return 'warning'
  }
}
function isOverdue(alertDate: string): boolean {
  const today = new Date().toISOString().split('T')[0] ?? ''
  return alertDate < today
}
function formatAlertDate(alertDate: string): string {
  const today = new Date().toISOString().split('T')[0]
  if (alertDate === today) return 'TODAY'
  const d = new Date(alertDate + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Search ─────────────────────────────────────────────────────────
interface SearchResult { type: 'note' | 'page'; id: string; title: string; excerpt: string; matches: number }
const searchQuery = ref('')
const searchResults = ref<SearchResult[]>([])
const searchLoading = ref(false)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function debouncedSearch() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(performSearch, 300)
}
async function performSearch() {
  const q = searchQuery.value.trim()
  if (q.length < 2) { searchResults.value = []; return }
  searchLoading.value = true
  try {
    searchResults.value = await $fetch<SearchResult[]>('/api/search', { query: { q } })
  } catch {
    searchResults.value = []
  } finally {
    searchLoading.value = false
  }
}

// Focus search input when search panel opens
watch(activePanel, (panel) => {
  if (panel === 'search') {
    nextTick(() => {
      const input = document.querySelector('.search-input input') as HTMLInputElement
      input?.focus()
    })
  }
})

// ── Toggle ─────────────────────────────────────────────────────────
function toggle(panel: Exclude<PanelName, null>) {
  activePanel.value = activePanel.value === panel ? null : panel
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  right: 0;
  top: 64px;
  bottom: 0;
  display: flex;
  flex-direction: row;
  z-index: 200;
}

/* Narrow button strip - always visible */
.sidebar-strip {
  width: 40px;
  background: #1a1a2e;
  border-left: 1px solid #2e2e4e;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 4px;
  gap: 2px;
  flex-shrink: 0;
}

.strip-btn {
  flex-shrink: 0;
}

.strip-spacer {
  flex: 1;
}

/* Panel that slides in to the left of the strip */
.sidebar-panel {
  width: 300px;
  background: #1a1a2e;
  border-left: 1px solid #2e2e4e;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  order: -1; /* appears to the LEFT of the strip */
}

.panel-header {
  display: flex;
  align-items: center;
  padding: 12px 12px 10px;
  border-bottom: 1px solid #2e2e4e;
  flex-shrink: 0;
}

.alert-header {
  background: rgba(244, 67, 54, 0.1);
}

.reminder-list,
.result-list {
  flex: 1;
  overflow-y: auto;
  background: transparent !important;
}

.reminder-item,
.result-item {
  border-radius: 6px;
  margin-bottom: 2px;
}

.alert-item {
  background: rgba(244, 67, 54, 0.12) !important;
  border-left: 3px solid #f44336;
}

.alert-item:hover {
  background: rgba(244, 67, 54, 0.22) !important;
}

.reminder-text,
.excerpt {
  white-space: normal;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.reminder-link {
  color: inherit;
  text-decoration: none;
}
.reminder-link:hover {
  color: #9c8fff;
}

.search-input {
  flex-shrink: 0;
  margin: 8px 12px 4px;
  width: calc(100% - 24px);
}

:deep(.search-input .v-field) {
  background: #0f0f17;
}

.text-xs {
  font-size: 11px;
}
</style>
