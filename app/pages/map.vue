<template>
  <v-container fluid class="pa-4 pa-sm-6 map-page">
    <div class="map-layout">
      <!-- Sidebar -->
      <div class="map-sidebar">
        <div class="d-flex align-center mb-3">
          <v-icon color="teal" class="mr-2">mdi-map</v-icon>
          <h1 class="text-h6 font-weight-bold">Map</h1>
          <v-spacer />
          <v-chip size="small" variant="tonal" color="teal">
            {{ geocodedLocations.length }} pins
          </v-chip>
        </div>

        <v-text-field
          v-model="searchQuery"
          placeholder="Search..."
          variant="outlined"
          density="compact"
          hide-details
          clearable
          prepend-inner-icon="mdi-magnify"
          class="mb-3"
        />

        <div class="location-list">
          <v-list density="compact" class="pa-0">
            <v-list-item
              v-for="loc in filteredLocations"
              :key="loc.name"
              :active="selectedName === loc.name"
              active-color="teal"
              class="location-list-item rounded mb-1"
              @click="selectLocation(loc.name)"
            >
              <template #prepend>
                <v-icon
                  :color="loc.lat != null ? 'teal' : 'grey'"
                  size="18"
                >
                  {{ loc.lat != null ? 'mdi-map-marker' : 'mdi-map-marker-question' }}
                </v-icon>
              </template>
              <v-list-item-title class="text-body-2">{{ loc.name }}</v-list-item-title>
              <v-list-item-subtitle v-if="loc.lat != null" class="text-caption">
                {{ loc.lat.toFixed(3) }}, {{ loc.lng!.toFixed(3) }}
              </v-list-item-subtitle>
              <template #append>
                <v-btn
                  :to="`/location/${encodeURIComponent(loc.name)}`"
                  icon="mdi-open-in-new"
                  variant="text"
                  size="x-small"
                  @click.stop
                />
              </template>
            </v-list-item>
            <v-list-item v-if="filteredLocations.length === 0 && !pending">
              <v-list-item-title class="text-caption text-medium-emphasis">
                No locations found
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </div>

        <v-btn
          to="/locations"
          color="teal"
          variant="tonal"
          size="small"
          block
          prepend-icon="mdi-plus"
          class="mt-3"
        >
          Manage locations
        </v-btn>
      </div>

      <!-- Map -->
      <div class="map-area">
        <ClientOnly>
          <MapView
            ref="mapViewRef"
            :locations="locations ?? []"
            :selected-name="selectedName"
            @select="selectLocation"
          />
          <template #fallback>
            <div class="d-flex justify-center align-center" style="height: 100%">
              <v-progress-circular indeterminate color="teal" />
            </div>
          </template>
        </ClientOnly>
      </div>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import type { LocationMeta } from '#shared/types/notes'

useHead({ title: 'Map' })

const { data: locations, pending } = useFetch<LocationMeta[]>('/api/locations', {
  server: false,
  lazy: true,
  default: () => [],
})

const searchQuery = ref<string | null>('')
const selectedName = ref<string | undefined>(undefined)
const mapViewRef = ref<{ panTo?: (name: string) => void } | null>(null)

const geocodedLocations = computed(() =>
  (locations.value ?? []).filter(l => l.lat != null),
)

const filteredLocations = computed(() => {
  const q = searchQuery.value?.trim().toLowerCase() ?? ''
  if (!q) return locations.value ?? []
  return (locations.value ?? []).filter(
    l => l.name.toLowerCase().includes(q) || l.tags.some(t => t.includes(q)),
  )
})

function selectLocation(name: string) {
  selectedName.value = name
  mapViewRef.value?.panTo?.(name)
}
</script>

<style scoped>
.map-page {
  height: calc(100vh - var(--v-layout-top, 64px));
  display: flex;
  flex-direction: column;
}

.map-layout {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

.map-sidebar {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.location-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.location-list-item {
  cursor: pointer;
}

.map-area {
  flex: 1;
  min-height: 0;
  border-radius: 8px;
  overflow: hidden;
}
</style>
