<!-- Copyright (C) 2026 TheHappyAkita - SPDX-License-Identifier: GPL-3.0-only -->
<template>
  <v-container fluid class="pa-4 pa-sm-6">
    <div class="d-flex align-center mb-4">
      <v-icon color="teal" class="mr-2">mdi-account-group</v-icon>
      <h1 class="text-h6 font-weight-bold">Meetings</h1>
      <v-spacer />
      <v-chip size="small" variant="tonal" color="teal">
        {{ filteredMeetings.length }} / {{ meetings?.length ?? 0 }} meetings
      </v-chip>
      <v-btn
        color="teal"
        prepend-icon="mdi-plus"
        class="ml-4"
        @click="showCreateDialog = true"
      >
        New Meeting
      </v-btn>
    </div>

    <!-- Search -->
    <v-text-field
      v-model="search"
      prepend-inner-icon="mdi-magnify"
      placeholder="Search meetings…"
      variant="outlined"
      density="compact"
      hide-details
      clearable
      class="mb-4"
    />

    <!-- Tag filter chips -->
    <div v-if="allTags.length > 0" class="mb-4 d-flex flex-wrap gap-2 align-center">
      <v-icon size="16" color="teal" class="mr-1">mdi-tag-multiple</v-icon>
      <v-chip
        v-for="tag in allTags"
        :key="tag"
        size="small"
        :variant="selectedTags.has(tag) ? 'flat' : 'tonal'"
        :color="selectedTags.has(tag) ? 'teal' : undefined"
        class="cursor-pointer"
        @click="toggleTag(tag)"
      >
        #{{ tag }}
      </v-chip>
      <v-btn
        v-if="selectedTags.size > 0"
        size="x-small"
        variant="text"
        color="teal"
        @click="selectedTags.clear()"
      >
        Clear filter
      </v-btn>
    </div>

    <!-- List -->
    <v-progress-circular v-if="pending" indeterminate color="teal" class="d-flex mx-auto" />

    <v-alert v-else-if="!meetings?.length" type="info" variant="tonal" class="mb-4">
      No meetings yet. Create your first meeting above!
    </v-alert>

    <v-row v-else dense>
      <v-col
        v-for="meeting in filteredMeetings"
        :key="meeting.slug"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card
          variant="outlined"
          class="meeting-card"
          hover
          density="compact"
          :to="`/meeting/${encodeURIComponent(meeting.name)}`"
        >
          <v-card-item class="py-2 px-3">
            <template #prepend>
              <v-icon color="teal" size="20">mdi-account-group</v-icon>
            </template>
            <v-card-title class="text-subtitle-2 font-weight-bold text-truncate">
              {{ meeting.name }}
            </v-card-title>
          </v-card-item>
          <v-card-text v-if="meeting.tags.length > 0" class="pt-0 pb-2 px-3">
            <v-chip
              v-for="tag in meeting.tags"
              :key="tag"
              size="x-small"
              variant="tonal"
              color="teal"
              class="mr-1"
              @click.prevent="toggleTag(tag)"
            >
              #{{ tag }}
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Create Meeting Dialog -->
    <v-dialog v-model="showCreateDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h6">Create New Meeting</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="createMeeting">
            <v-text-field
              v-model="newName"
              label="Meeting name"
              placeholder="e.g., Q3 Planning, Sprint Review"
              variant="outlined"
              density="comfortable"
              autofocus
              :error-messages="nameError"
              @keyup.enter="createMeeting"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showCreateDialog = false">Cancel</v-btn>
          <v-btn
            color="teal"
            variant="flat"
            :disabled="!valid"
            :loading="creating"
            @click="createMeeting"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import type { MeetingMeta } from '#shared/types/notes'

useHead({ title: 'Meetings' })

const { data: meetings, pending, refresh } = await useFetch<MeetingMeta[]>('/api/meetings', {
  server: false,
  default: () => [],
})

const showCreateDialog = ref(false)
const newName = ref('')
const creating = ref(false)
const search = ref('')
const selectedTags = reactive(new Set<string>())

const valid = computed(() => {
  const trimmed = newName.value.trim()
  return /^[a-zA-Z0-9_\-\. äöüÄÖÜáéíóúàèìòùâêîôûãõ]+$/.test(trimmed) && trimmed.length > 0 && trimmed.length <= 100
})

const nameError = computed(() => {
  const trimmed = newName.value.trim()
  if (!trimmed) return ''
  if (trimmed.length > 100) return 'Name must be 100 characters or less'
  if (!/^[a-zA-Z0-9_\-\. äöüÄÖÜáéíóúàèìòùâêîôûãõ]+$/.test(trimmed)) {
    return 'Name can only contain letters, numbers, spaces, dots, dashes, and underscores'
  }
  return ''
})

const sortedMeetings = computed(() => {
  return [...(meetings.value ?? [])].sort((a, b) => a.name.localeCompare(b.name))
})

const allTags = computed(() => {
  const tags = new Set<string>()
  for (const m of sortedMeetings.value) {
    for (const t of m.tags) tags.add(t)
  }
  return [...tags].sort()
})

const filteredMeetings = computed(() => {
  let result = sortedMeetings.value
  
  // Filter by tags
  if (selectedTags.size > 0) {
    result = result.filter(m => [...selectedTags].every(t => m.tags.includes(t)))
  }
  
  // Filter by search
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase()
    result = result.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.tags.some(t => t.toLowerCase().includes(q))
    )
  }
  
  return result
})

function toggleTag(tag: string) {
  if (selectedTags.has(tag)) selectedTags.delete(tag)
  else selectedTags.add(tag)
}

async function createMeeting(): Promise<void> {
  const name = newName.value.trim()
  if (!valid.value) return

  creating.value = true
  try {
    await $fetch(`/api/meetings/${encodeURIComponent(name)}`, {
      method: 'PUT',
      body: { content: `# ${name}\n\n` },
    })
    newName.value = ''
    showCreateDialog.value = false
    await refresh()
    await navigateTo(`/meeting/${encodeURIComponent(name)}`)
  } catch (err) {
    console.error('Failed to create meeting:', err)
  } finally {
    creating.value = false
  }
}
</script>

<style scoped>
.meeting-card {
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s;
}
.meeting-card:hover {
  transform: translateY(-2px);
  border-color: rgb(var(--v-theme-teal));
}
.gap-2 {
  gap: 8px;
}
.cursor-pointer {
  cursor: pointer;
}
</style>
