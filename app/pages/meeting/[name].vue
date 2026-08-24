<!-- Copyright (C) 2026 TheHappyAkita - SPDX-License-Identifier: GPL-3.0-only -->
<template>
  <v-container fluid class="pa-4 pa-sm-6">
    <div class="editor-page">
      <div class="d-flex align-center mb-4">
        <v-btn icon variant="text" size="small" class="mr-2" to="/meetings">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        <v-icon color="teal" class="mr-2">mdi-account-group</v-icon>
        <h1 class="text-h6 font-weight-bold">{{ meetingName }}</h1>
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
          title="Delete meeting"
          @click="deleteDialog = true"
        />
      </div>

      <!-- Tags row -->
      <div class="d-flex flex-wrap align-center gap-1 mb-3">
        <v-chip
          v-for="tag in currentTags"
          :key="tag"
          size="small"
          variant="tonal"
          color="teal"
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
          color="teal"
          prepend-icon="mdi-tag-plus"
          @click="startAddTag"
        >
          Add tag
        </v-btn>
      </div>

      <!-- Meeting metadata card -->
      <v-card variant="outlined" class="mb-3">
        <v-card-text class="d-flex flex-wrap ga-3">
          <v-text-field
            v-model="meetingDate"
            label="When"
            type="datetime-local"
            variant="outlined"
            density="compact"
            hide-details
            class="metadata-field"
            @blur="saveNow"
          />
          <v-select
            v-model="meetingTimezone"
            label="Timezone"
            :items="timezones"
            variant="outlined"
            density="compact"
            hide-details
            class="metadata-field"
            @update:model-value="saveNow"
          />
          <v-text-field
            v-model="topic"
            label="Topic"
            placeholder="Meeting topic"
            variant="outlined"
            density="compact"
            hide-details
            class="metadata-field"
            @blur="saveNow"
          />
          <v-combobox
            v-model="attendeesArray"
            label="Attendees"
            :items="allPersons"
            placeholder="Type or select attendees"
            variant="outlined"
            density="compact"
            hide-details
            multiple
            chips
            closable-chips
            :return-object="false"
            class="metadata-field metadata-attendees"
            @update:model-value="saveNow"
          >
            <template #chip="{ props, item }">
              <v-chip
                v-bind="props"
                size="small"
                color="pink"
                :text="String(item)"
              />
            </template>
          </v-combobox>
        </v-card-text>
      </v-card>

      <NoteEditor v-model="content" @blur="saveNow" />
    </div>
  </v-container>

  <!-- Delete confirmation dialog -->
  <v-dialog v-model="deleteDialog" max-width="400">
    <v-card>
      <v-card-title class="text-h6">Delete Meeting?</v-card-title>
      <v-card-text>
        Are you sure you want to delete "{{ meetingName }}"? This cannot be undone.
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
        <v-btn color="error" variant="flat" @click="deleteMeeting">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { updateFrontmatterFields } from '#shared/utils/location'

const route = useRoute()
const router = useRouter()
const meetingName = computed(() => decodeURIComponent(route.params.name as string))

useHead({
  title: meetingName.value,
})

const { data: meetingData } = await useFetch<{ name: string; content: string }>(
  () => `/api/meetings/${encodeURIComponent(meetingName.value)}`,
  {
    watch: [meetingName],
    server: false,
    default: () => ({ name: meetingName.value, content: '' }),
  }
)

// Fetch all persons for autocomplete
const { data: allPersonsRaw } = await useFetch<{ name: string; tags: string[] }[]>('/api/persons', {
  server: false,
  default: () => [],
})
const allPersons = computed(() => allPersonsRaw.value?.map(p => p.name) ?? [])

const content = ref('')
const meetingDate = ref('')
const meetingTimezone = ref(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC')
const topic = ref('')
const attendeesArray = ref<string[]>([])
const saving = ref(false)
const saved = ref(false)
const deleteDialog = ref(false)

// IANA timezone list
const timezones = [
  'UTC',
  'Africa/Abidjan',
  'Africa/Accra',
  'Africa/Addis_Ababa',
  'Africa/Algiers',
  'Africa/Cairo',
  'Africa/Casablanca',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Nairobi',
  'America/Anchorage',
  'America/Argentina/Buenos_Aires',
  'America/Bogota',
  'America/Caracas',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/New_York',
  'America/Phoenix',
  'America/Santiago',
  'America/Sao_Paulo',
  'America/Toronto',
  'America/Vancouver',
  'Asia/Bangkok',
  'Asia/Beirut',
  'Asia/Colombo',
  'Asia/Dubai',
  'Asia/Hong_Kong',
  'Asia/Jakarta',
  'Asia/Jerusalem',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Manila',
  'Asia/Riyadh',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Taipei',
  'Asia/Tehran',
  'Asia/Tokyo',
  'Atlantic/Reykjavik',
  'Australia/Adelaide',
  'Australia/Brisbane',
  'Australia/Melbourne',
  'Australia/Perth',
  'Australia/Sydney',
  'Europe/Amsterdam',
  'Europe/Athens',
  'Europe/Berlin',
  'Europe/Brussels',
  'Europe/Budapest',
  'Europe/Copenhagen',
  'Europe/Dublin',
  'Europe/Helsinki',
  'Europe/Istanbul',
  'Europe/Lisbon',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Moscow',
  'Europe/Oslo',
  'Europe/Paris',
  'Europe/Prague',
  'Europe/Rome',
  'Europe/Stockholm',
  'Europe/Vienna',
  'Europe/Warsaw',
  'Europe/Zurich',
  'Pacific/Auckland',
  'Pacific/Fiji',
  'Pacific/Honolulu',
]

// ─── Tags ─────────────────────────────────────────────────────────
const addingTag = ref(false)
const newTag = ref('')
const tagInputRef = ref<{ focus: () => void } | null>(null)

const currentTags = computed(() => {
  const c = content.value
  if (!c) return []
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
        content.value = `---\n${cleaned ? cleaned + '\n' : ''}${tagLine}\n\n---${rest}`
        return
      }
      if (cleaned) {
        content.value = `---\n${cleaned}\n\n---${rest}`
        return
      }
      content.value = rest.trimStart()
      return
    }
  }
  if (tagLine) content.value = `---\n${tagLine}\n\n---\n${c}`
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

// ─── Metadata parsing ─────────────────────────────────────────────
function parseMetadata(source: string): void {
  const match = source.match(/^---\n([\s\S]*?)\n---(?:\n|$)/)
  const frontmatter: string = match?.[1] ?? ''
  meetingDate.value = frontmatter.match(/^date:\s*(.+)$/m)?.[1]?.trim() ?? ''
  meetingTimezone.value = frontmatter.match(/^timezone:\s*(.+)$/m)?.[1]?.trim() ?? meetingTimezone.value
  topic.value = frontmatter.match(/^topic:\s*(.+)$/m)?.[1]?.trim() ?? ''
  
  // Parse attendees from frontmatter - support both @[[Name]] format and plain names
  const attendeesMatch = frontmatter.match(/^attendees:\s*\[(.*)\]\s*$/m)
  if (attendeesMatch && attendeesMatch[1]) {
    const attendeesStr = attendeesMatch[1]
    const attendees: string[] = []
    
    // Use regex to match @[[...]] patterns, which can contain commas
    const mentionRegex = /@\[\[([^\]]+)\]\]/g
    let lastIndex = 0
    let match: RegExpExecArray | null
    
    while ((match = mentionRegex.exec(attendeesStr)) !== null) {
      // Add any plain text before this mention (split by comma)
      const beforeText = attendeesStr.slice(lastIndex, match.index)
      if (beforeText.trim()) {
        beforeText.split(',').forEach(name => {
          const trimmed = name.trim()
          if (trimmed) attendees.push(trimmed)
        })
      }
      
      // Add the person mention (name can contain commas)
      if (match[1]) {
        attendees.push(match[1])
      }
      lastIndex = mentionRegex.lastIndex
    }
    
    // Add any remaining plain text after the last mention
    const afterText = attendeesStr.slice(lastIndex)
    if (afterText.trim()) {
      afterText.split(',').forEach(name => {
        const trimmed = name.trim()
        if (trimmed) attendees.push(trimmed)
      })
    }
    
    attendeesArray.value = attendees.filter((name): name is string => Boolean(name))
  } else {
    attendeesArray.value = []
  }
}

watch(() => meetingData.value?.content, (value) => {
  if (value !== undefined) {
    content.value = value
    parseMetadata(value)
  }
}, { immediate: true })

function metadataContent(): string {
  const tags: string[] = currentTags.value
  const formattedAttendees: string[] = attendeesArray.value
    .filter(Boolean)
    .map((name: string): string => `@[[${name}]]`)

  return updateFrontmatterFields(content.value, {
    tags: tags.length > 0 ? `[${tags.join(', ')}]` : null,
    date: meetingDate.value || null,
    timezone: meetingDate.value ? meetingTimezone.value : null,
    topic: topic.value.trim() || null,
    attendees: formattedAttendees.length > 0 ? `[${formattedAttendees.join(', ')}]` : null,
  })
}

async function saveNow() {
  if (saving.value) return
  saving.value = true
  saved.value = false
  try {
    const newContent = metadataContent()
    await $fetch(`/api/meetings/${encodeURIComponent(meetingName.value)}`, {
      method: 'PUT',
      body: { content: newContent },
    })
    // Update content to keep it in sync with saved state
    content.value = newContent
    // Don't call parseMetadata here - the reactive values are already correct
    // and calling it would overwrite user input
    saved.value = true
    setTimeout(() => (saved.value = false), 2000)
  } catch (err) {
    console.error('Failed to save meeting:', err)
  } finally {
    saving.value = false
  }
}

async function deleteMeeting() {
  try {
    await $fetch(`/api/meetings/${encodeURIComponent(meetingName.value)}`, {
      method: 'DELETE',
    })
    deleteDialog.value = false
    router.push('/meetings')
  } catch (err) {
    console.error('Failed to delete meeting:', err)
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

.metadata-field {
  flex: 1 1 180px;
  min-width: 180px;
}

.metadata-attendees {
  flex-basis: 280px;
}
</style>
