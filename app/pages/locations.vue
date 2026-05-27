<!-- Copyright (C) 2026 TheHappyAkita - SPDX-License-Identifier: GPL-3.0-only -->
<template>
  <div class="locations-scroll">
    <v-container fluid class="pa-4 pa-sm-6">
      <div class="d-flex align-center mb-4">
        <v-icon color="teal" class="mr-2">mdi-map-marker-multiple</v-icon>
        <h1 class="text-h6 font-weight-bold">Locations</h1>
        <v-spacer />
        <v-chip size="small" variant="tonal" color="teal">
          {{ filteredLocations.length }} / {{ locations?.length ?? 0 }} locations
        </v-chip>
      </div>

      <!-- Create new location -->
      <v-card class="mb-4" variant="outlined">
        <v-card-text class="pa-3">
          <v-form @submit.prevent="createLocation">
            <v-text-field
              v-model="newLocationName"
              label="New location"
              placeholder="e.g., Berlin, Germany"
              variant="outlined"
              density="compact"
              hide-details
              class="mb-2"
              @keyup.enter="createLocation"
            >
              <template #append>
                <v-btn
                  color="teal"
                  variant="flat"
                  size="small"
                  :disabled="!isValidNewName"
                  :loading="creating"
                  @click="createLocation"
                >
                  Create
                </v-btn>
              </template>
            </v-text-field>
            <div class="text-caption text-medium-emphasis">
              Mention in notes with <code>&amp;[[Location Name]]</code> or <code>&amp;[[Name|lat,lng]]</code> (inline coords)
            </div>
          </v-form>
        </v-card-text>
      </v-card>

      <!-- Filter -->
      <v-text-field
        v-model="filterQuery"
        placeholder="Search locations..."
        variant="outlined"
        density="compact"
        hide-details
        clearable
        prepend-inner-icon="mdi-magnify"
        class="mb-4"
      />

      <!-- Location list -->
      <v-row dense>
        <v-col
          v-for="loc in filteredLocations"
          :key="loc.name"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <v-card
            :to="`/location/${encodeURIComponent(loc.name)}`"
            variant="outlined"
            class="location-card"
            :class="{ 'has-coords': loc.lat != null }"
          >
            <v-card-text class="pa-3">
              <div class="d-flex align-center mb-1">
                <v-icon
                  :color="loc.lat != null ? 'teal' : 'grey'"
                  size="16"
                  class="mr-1"
                >
                  {{ loc.lat != null ? 'mdi-map-marker' : 'mdi-map-marker-question' }}
                </v-icon>
                <span class="font-weight-medium text-body-2">{{ loc.name }}</span>
              </div>
              <div v-if="loc.lat != null" class="text-caption text-medium-emphasis mb-1">
                {{ loc.lat.toFixed(4) }}, {{ loc.lng!.toFixed(4) }}
              </div>
              <div v-if="loc.tags.length" class="d-flex flex-wrap gap-1 mt-1">
                <v-chip
                  v-for="tag in loc.tags"
                  :key="tag"
                  size="x-small"
                  variant="tonal"
                  color="teal"
                >
                  #{{ tag }}
                </v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col v-if="filteredLocations.length === 0 && !pending" cols="12">
          <v-alert type="info" variant="tonal">
            No locations yet. Create one above, then mention it in notes using <code>&amp;[[Location Name]]</code>.
          </v-alert>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import type { LocationMeta } from '#shared/types/notes'

useHead({ title: 'Locations' })

const { data: locations, pending, refresh } = await useFetch<LocationMeta[]>('/api/locations', {
  server: false,
  default: () => [],
})

const newLocationName = ref('')
const creating = ref(false)
const filterQuery = ref<string | null>('')

const isValidNewName = computed(() => {
  const n = newLocationName.value.trim()
  return n.length > 0 && n.length <= 120
})

const filteredLocations = computed<LocationMeta[]>(() => {
  const q = filterQuery.value?.trim().toLowerCase() ?? ''
  if (!q) return locations.value ?? []
  return (locations.value ?? []).filter(
    l => l.name.toLowerCase().includes(q) || l.tags.some(t => t.includes(q)),
  )
})

async function createLocation() {
  const name = newLocationName.value.trim()
  if (!name) return
  creating.value = true
  try {
    await $fetch(`/api/locations/${encodeURIComponent(name)}`, {
      method: 'PUT' as 'GET',
      body: { content: `# ${name}\n` },
    })
    newLocationName.value = ''
    await refresh()
    navigateTo(`/location/${encodeURIComponent(name)}`)
  } finally {
    creating.value = false
  }
}
</script>

<style scoped>
.locations-scroll {
  height: calc(100vh - var(--v-layout-top, 64px));
  overflow-y: auto;
}

.location-card {
  transition: border-color 0.2s;
}

.location-card:hover {
  border-color: rgba(38, 166, 154, 0.5);
}

.location-card.has-coords {
  border-color: rgba(38, 166, 154, 0.3);
}
</style>
