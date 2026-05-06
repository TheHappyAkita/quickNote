<template>
  <div class="reminders-panel" :class="{ collapsed: isCollapsed }">
    <!-- Alert Bell Toggle (only shown when alerts exist) -->
    <v-btn
      v-if="alertCount > 0"
      icon
      size="small"
      variant="text"
      class="alert-toggle-btn"
      :color="activeView === 'alerts' ? 'error' : undefined"
      :title="activeView === 'alerts' ? 'Hide alerts' : `Show ${alertCount} alert${alertCount > 1 ? 's' : ''}`"
      @click="toggleAlerts"
    >
      <v-badge :content="alertCount" color="error" offset-x="4" offset-y="-4">
        <v-icon color="error">mdi-bell-alert</v-icon>
      </v-badge>
    </v-btn>

    <!-- Reminder Bell Toggle -->
    <v-btn
      v-if="regularCount > 0"
      icon
      size="small"
      variant="text"
      class="reminder-toggle-btn"
      :class="{ 'offset-left': alertCount === 0 }"
      :color="activeView === 'reminders' ? 'warning' : undefined"
      :title="activeView === 'reminders' ? 'Hide reminders' : `Show ${regularCount} reminder${regularCount > 1 ? 's' : ''}`"
      @click="toggleReminders"
    >
      <v-badge :content="regularCount" color="warning" offset-x="4" offset-y="-4">
        <v-icon color="warning">mdi-bell-outline</v-icon>
      </v-badge>
    </v-btn>

    <div v-show="!isCollapsed" class="panel-content">
      <!-- Dynamic Header based on active view -->
      <div class="panel-header" :class="{ 'alert-header': activeView === 'alerts' }">
        <template v-if="activeView === 'alerts'">
          <v-icon size="18" color="error" class="mr-2">mdi-bell-alert</v-icon>
          <span class="font-weight-bold text-error">Alerts</span>
          <v-spacer />
          <v-chip size="x-small" variant="tonal" color="error">{{ alertCount }}</v-chip>
        </template>
        <template v-else>
          <v-icon size="18" color="warning" class="mr-2">mdi-bell-outline</v-icon>
          <span class="font-weight-bold text-warning">Reminders</span>
          <v-spacer />
          <v-chip size="x-small" variant="tonal" color="warning">{{ regularCount }}</v-chip>
        </template>
      </div>

      <div v-if="pending" class="d-flex justify-center pa-4">
        <v-progress-circular indeterminate size="20" color="warning" />
      </div>

      <div v-else-if="!reminders?.length" class="text-caption text-medium-emphasis pa-3 text-center">
        No reminders found.<br>
        <span class="text-xs">Use "Remind: text" or "Reminder: text" in notes</span>
      </div>

      <!-- Show only Alerts -->
      <v-list v-else-if="activeView === 'alerts'" density="compact" class="reminder-list">
        <v-list-item
          v-for="reminder in alerts"
          :key="`${reminder.date}-${reminder.text}`"
          class="reminder-item alert-item"
        >
          <template #prepend>
            <v-icon size="14" color="error" class="mr-2">mdi-bell-alert</v-icon>
          </template>

          <v-list-item-title class="text-body-2 reminder-text">
            <NuxtLink :to="`/note/${reminder.date}`" class="reminder-link">
              {{ reminder.text }}
            </NuxtLink>
          </v-list-item-title>

          <v-list-item-subtitle class="text-caption">
            <v-icon size="12" color="error" class="mr-1">mdi-clock-alert</v-icon>
            <span :class="{ 'text-error font-weight-bold': isOverdue(reminder.alertDate!) }">
              {{ formatAlertDate(reminder.alertDate!) }}
            </span>
            <span class="text-medium-emphasis ml-1">(in {{ formatDate(reminder.date) }})</span>
          </v-list-item-subtitle>

          <template #append>
            <v-btn
              icon="mdi-check"
              size="x-small"
              variant="text"
              color="success"
              title="Mark as done / Dismiss"
              @click.prevent="dismiss(reminder)"
            />
          </template>
        </v-list-item>
      </v-list>

      <!-- Show only Reminders -->
      <v-list v-else density="compact" class="reminder-list">
        <v-list-item
          v-for="reminder in regularReminders"
          :key="`${reminder.date}-${reminder.text}`"
          class="reminder-item"
        >
          <template #prepend>
            <v-icon size="14" :color="iconColor(reminder.keyword)" class="mr-2">
              {{ iconFor(reminder.keyword) }}
            </v-icon>
          </template>

          <v-list-item-title class="text-body-2 reminder-text">
            <NuxtLink :to="`/note/${reminder.date}`" class="reminder-link">
              {{ reminder.text }}
            </NuxtLink>
          </v-list-item-title>

          <v-list-item-subtitle class="text-caption">
            {{ formatDate(reminder.date) }}
          </v-list-item-subtitle>

          <template #append>
            <v-btn
              icon="mdi-check"
              size="x-small"
              variant="text"
              color="success"
              title="Mark as done / Dismiss"
              @click.prevent="dismiss(reminder)"
            />
          </template>
        </v-list-item>
      </v-list>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Reminder } from '#shared/types/notes'

const isCollapsed = ref(true)
const activeView = ref<'alerts' | 'reminders'>('reminders')
const emit = defineEmits<{
  'update:collapsed': [value: boolean]
}>()

function toggleAlerts() {
  if (isCollapsed.value) {
    isCollapsed.value = false
    activeView.value = 'alerts'
  } else if (activeView.value === 'alerts') {
    isCollapsed.value = true
  } else {
    activeView.value = 'alerts'
  }
  emit('update:collapsed', isCollapsed.value)
}

function toggleReminders() {
  if (isCollapsed.value) {
    isCollapsed.value = false
    activeView.value = 'reminders'
  } else if (activeView.value === 'reminders') {
    isCollapsed.value = true
  } else {
    activeView.value = 'reminders'
  }
  emit('update:collapsed', isCollapsed.value)
}

const { data: reminders, pending, refresh } = await useFetch<Reminder[]>('/api/notes/reminders', {
  server: false,
  default: () => [],
})

// Computed: separate alerts and regular reminders
const alerts = computed(() => reminders.value?.filter(r => r.keyword === 'alert') ?? [])
const regularReminders = computed(() => reminders.value?.filter(r => r.keyword !== 'alert') ?? [])
const alertCount = computed(() => alerts.value.length)
const regularCount = computed(() => regularReminders.value.length)

async function dismiss(reminder: Reminder) {
  await $fetch('/api/notes/reminders/dismiss', {
    method: 'POST' as 'GET',
    body: { date: reminder.date, text: reminder.text },
  })
  await refresh()
}

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
    case 'reminder': return 'mdi-clock-alert-outline'
    case 'alert': return 'mdi-bell-alert'
    default: return 'mdi-bell'
  }
}

function iconColor(keyword: Reminder['keyword']): string {
  switch (keyword) {
    case 'remind': return 'warning'
    case 'remindme': return 'error'
    case 'reminder': return 'info'
    case 'alert': return 'error' // Red for alerts
    default: return 'warning'
  }
}

function isOverdue(alertDate: string): boolean {
  const today = new Date().toISOString().split('T')[0]
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
</script>

<style scoped>
.reminders-panel {
  position: fixed;
  right: 0;
  top: 64px; /* Below app bar */
  bottom: 0;
  width: 280px;
  background: #1a1a2e;
  border-left: 1px solid #2e2e4e;
  z-index: 100;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.reminders-panel:not(.collapsed) {
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.5);
}

.reminders-panel.collapsed {
  transform: translateX(calc(100% - 40px));
  pointer-events: none;
}

.reminders-panel.collapsed .alert-toggle-btn,
.reminders-panel.collapsed .reminder-toggle-btn {
  pointer-events: auto;
}

.alert-toggle-btn,
.reminder-toggle-btn {
  position: absolute;
  left: 4px;
  top: 8px;
  z-index: 10;
}

.reminder-toggle-btn {
  top: 48px; /* Stack below alert button */
}

.reminder-toggle-btn.offset-left {
  top: 8px; /* When alert button is hidden, position at top */
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

.section-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 4px;
}

.alert-header {
  background: rgba(244, 67, 54, 0.1);
}

.alert-item {
  background: rgba(244, 67, 54, 0.15) !important;
  border-left: 3px solid #f44336;
}

.alert-item:hover {
  background: rgba(244, 67, 54, 0.25) !important;
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

.reminder-link {
  color: inherit;
  text-decoration: none;
  transition: color 0.2s;
}

.reminder-link:hover {
  color: #9c8fff;
}
</style>
