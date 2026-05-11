<template>
  <div class="persons-scroll">
    <v-container fluid class="pa-4 pa-sm-6">
      <div class="d-flex align-center mb-4">
        <v-icon color="pink" class="mr-2">mdi-account-group</v-icon>
        <h1 class="text-h6 font-weight-bold">People</h1>
        <v-spacer />
        <v-chip size="small" variant="tonal" color="pink">
          {{ filteredPersons.length }} / {{ persons?.length ?? 0 }} people
        </v-chip>
      </div>

      <!-- Create new person -->
      <v-card class="mb-4" variant="outlined">
        <v-card-text class="pa-3">
          <v-form @submit.prevent="createPerson">
            <v-text-field
              v-model="newPersonName"
              label="New person"
              placeholder="e.g., Doe, John"
              variant="outlined"
              density="compact"
              hide-details
              class="mb-2"
              @keyup.enter="createPerson"
            >
              <template #append>
                <v-btn
                  color="pink"
                  variant="flat"
                  size="small"
                  :disabled="!isValidNewName"
                  :loading="creating"
                  @click="createPerson"
                >
                  Create
                </v-btn>
              </template>
            </v-text-field>
            <div class="text-caption text-medium-emphasis">
              Use letters, numbers, spaces, commas, hyphens, periods — e.g. "Doe, John"
            </div>
          </v-form>
        </v-card-text>
      </v-card>

      <!-- Search -->
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        placeholder="Search people…"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        class="mb-3"
      />

      <!-- Tag filter chips -->
      <div v-if="allTags.length > 0" class="mb-4 d-flex flex-wrap gap-2 align-center">
        <v-icon size="16" color="pink" class="mr-1">mdi-tag-multiple</v-icon>
        <v-chip
          v-for="tag in allTags"
          :key="tag"
          size="small"
          :variant="selectedTags.has(tag) ? 'flat' : 'tonal'"
          :color="selectedTags.has(tag) ? 'pink' : undefined"
          class="cursor-pointer"
          @click="toggleTag(tag)"
        >
          #{{ tag }}
        </v-chip>
        <v-btn
          v-if="selectedTags.size > 0"
          size="x-small"
          variant="text"
          color="pink"
          @click="selectedTags.clear()"
        >
          Clear filter
        </v-btn>
      </div>

      <!-- List -->
      <v-progress-circular v-if="pending" indeterminate color="pink" class="d-flex mx-auto" />

      <v-alert v-else-if="!persons?.length" type="info" variant="tonal" class="mb-4">
        No people yet. Create one above or use <code>@[[Lastname, Forename]]</code> in notes.
      </v-alert>

      <v-alert v-else-if="filteredPersons.length === 0" type="info" variant="tonal">
        No people match your search or tag filter.
      </v-alert>

      <v-row v-else dense>
        <v-col
          v-for="person in filteredPersons"
          :key="person.name"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <v-card
            variant="outlined"
            class="person-card"
            hover
            :to="`/person/${encodeURIComponent(person.name)}`"
          >
            <v-card-item>
              <template #prepend>
                <v-icon color="pink">mdi-account</v-icon>
              </template>
              <v-card-title class="text-body-1 text-truncate">
                {{ person.name }}
              </v-card-title>
            </v-card-item>
            <v-card-text v-if="person.tags.length > 0" class="pt-0 pb-2 px-3">
              <v-chip
                v-for="tag in person.tags"
                :key="tag"
                size="x-small"
                variant="tonal"
                color="pink"
                class="mr-1"
                @click.prevent="toggleTag(tag)"
              >
                #{{ tag }}
              </v-chip>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import type { PersonMeta } from '#shared/types/notes'

useHead({ title: 'People — quickNote' })

const { data: persons, pending, refresh } = await useFetch<PersonMeta[]>('/api/persons', {
  server: false,
  default: () => [],
})

const newPersonName = ref('')
const creating = ref(false)
const search = ref('')
const selectedTags = reactive(new Set<string>())

const PERSON_PATTERN = /^[a-zA-Z0-9,\. _\-]+$/

const isValidNewName = computed(() => {
  const v = newPersonName.value.trim()
  return v.length > 0 && v.length <= 120 && PERSON_PATTERN.test(v)
})

const sortedPersons = computed(() =>
  [...(persons.value ?? [])].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
)

const allTags = computed(() => {
  const tags = new Set<string>()
  for (const p of sortedPersons.value) for (const t of p.tags) tags.add(t)
  return [...tags].sort()
})

const filteredPersons = computed(() => {
  let list = sortedPersons.value
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(q))
  }
  if (selectedTags.size > 0) {
    list = list.filter(p => [...selectedTags].every(t => p.tags.includes(t)))
  }
  return list
})

function toggleTag(tag: string) {
  if (selectedTags.has(tag)) selectedTags.delete(tag)
  else selectedTags.add(tag)
}

async function createPerson() {
  const name = newPersonName.value.trim()
  if (!isValidNewName.value) return
  creating.value = true
  try {
    await $fetch(`/api/persons/${encodeURIComponent(name)}`, {
      method: 'PUT' as 'GET',
      body: { content: `# ${name}\n\n` },
    })
    newPersonName.value = ''
    await refresh()
    await navigateTo(`/person/${encodeURIComponent(name)}`)
  } catch (err) {
    console.error('Failed to create person:', err)
  } finally {
    creating.value = false
  }
}
</script>

<style scoped>
.persons-scroll {
  height: 100%;
  overflow-y: auto;
}
.person-card {
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s;
}
.person-card:hover {
  transform: translateY(-2px);
  border-color: #f06292;
}
.gap-2 { gap: 8px; }
.cursor-pointer { cursor: pointer; }
code {
  background: rgba(108, 99, 255, 0.12);
  color: #b8a5ff;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 0.82rem;
}
</style>
