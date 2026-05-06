<template>
  <div class="reminders-panel" :class="{ collapsed: isCollapsed }">
    <v-btn
      icon
      size="small"
      variant="text"
      class="toggle-btn"
      :title="isCollapsed ? 'Show reminders' : 'Hide reminders'"
      @click="toggle"
    >
      <v-icon>{{ isCollapsed ? 'mdi-bell-badge' : 'mdi-chevron-right' }}</v-icon>
    </v-btn>

    <div v-show="!isCollapsed" class="panel-content">
      <div class="panel-header">
        <v-icon size="18" color="warning" class="mr-2">mdi-bell-outline</v-icon>
        <span class="font-weight-bold">Reminders</span>
        <v-spacer />
        <v-chip size="x-small" variant="tonal" color="warning">{{ reminders?.length ?? 0 }}</v-chip>
      </div>

      <div v-if="pending" class="d-flex justify-center pa-4">
        <v-progress-circular indeterminate size="20" color="warning" />
      </div>

      <div v-else-if="!reminders?.length" class="text-caption text-medium-emphasis pa-3 text-center">
        No reminders found.<br>
        <span class="text-xs">Use "Remind: text" or "Reminder: text" in notes</span>
      </div>

      <v-list v-else density="compact" class="reminder-list">
        <v-list-item
          v-for="reminder in reminders"
          :key="`${reminder.date}-${reminder.text}`"
          :to="`/note/${reminder.date}`"
          class="reminder-item"
        >
          <template #prepend>
            <v-icon size="14" :color="iconColor(reminder.keyword)" class="mr-2">
              {{ iconFor(reminder.keyword) }}
            </v-icon>
          </template>

          <v-list-item-title class="text-body-2 reminder-text">
            {{ reminder.text }}
          </v-list-item-title>

          <v-list-item-subtitle class="text-caption">
            {{ formatDate(reminder.date) }}
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Reminder } from '#shared/types/notes'

const isCollapsed = ref(true)
const emit = defineEmits<{
  'update:collapsed': [value: boolean]
}>()

function toggle() {
  isCollapsed.value = !isCollapsed.value
  emit('update:collapsed', isCollapsed.value)
}

const { data: reminders, pending, refresh } = await useFetch<Reminder[]>('/api/notes/reminders', {
  server: false,
  default: () => [],
})

// Refresh every 30 seconds when panel is open
let interval: ReturnType<typeof setInterval> | null = null
watch(isCollapsed, (collapsed) => {
  if (!collapsed) {
    refresh()
    interval = setInterval(refresh, 30_000)
  } else if (interval) {
    clearInterval(interval)
    interval = null
  }
})
onBeforeUnmount(() => {
  if (interval) clearInterval(interval)
})

function iconFor(keyword: Reminder['keyword']): string {
  switch (keyword) {
    case 'remind': return 'mdi-bell-outline'
    case 'remindme': return 'mdi-bell-ring'
    case 'reminder': return 'mdi-clock-alert'
    default: return 'mdi-bell'
  }
}

function iconColor(keyword: Reminder['keyword']): string {
  switch (keyword) {
    case 'remind': return 'warning'
    case 'remindme': return 'error'
    case 'reminder': return 'info'
    default: return 'warning'
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.reminders-panel {
  position: fixed;
  right: 0;
  top: 64px; /* Below app bar */
  bottom: 0;
  width: 280px;
  background: rgba(26, 26, 46, 0.95);
  border-left: 1px solid #2e2e4e;
  z-index: 100;
  transition: transform 0.2s ease;
}

.reminders-panel.collapsed {
  transform: translateX(calc(100% - 40px));
  pointer-events: none;
}

.reminders-panel.collapsed .toggle-btn {
  pointer-events: auto;
}

.toggle-btn {
  position: absolute;
  left: 4px;
  top: 8px;
  z-index: 10;
}

.panel-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 12px;
  padding-left: 44px; /* Space for toggle button */
}

.panel-header {
  display: flex;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #2e2e4e;
  margin-bottom: 8px;
}

.reminder-list {
  flex: 1;
  overflow-y: auto;
  background: transparent !important;
}

.reminder-item {
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 4px;
}

.reminder-item:hover {
  background: rgba(108, 99, 255, 0.1);
}

.reminder-text {
  white-space: normal;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.text-xs {
  font-size: 11px;
}
</style>
