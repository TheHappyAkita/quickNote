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
            {{ visibleLocations.length }} / {{ allGeocodedCount }} pins
          </v-chip>
        </div>

        <!-- Search -->
        <v-text-field
          v-model="searchQuery"
          placeholder="Search locations..."
          variant="outlined"
          density="compact"
          hide-details
          clearable
          prepend-inner-icon="mdi-magnify"
          class="mb-3"
        />

        <!-- Time range filter -->
        <v-card variant="outlined" class="mb-3 pa-3">
          <div class="d-flex align-center mb-1">
            <v-icon size="14" color="teal" class="mr-1">mdi-calendar-range</v-icon>
            <span class="text-caption font-weight-medium">Time range</span>
            <v-spacer />
            <v-btn
              v-if="timeFiltered"
              size="x-small"
              variant="text"
              color="teal"
              @click="resetTimeFilter"
            >
              Reset
            </v-btn>
          </div>
          <div class="text-caption text-medium-emphasis mb-2">
            {{ sliderStartDate }} → {{ sliderEndDate }}
          </div>
          <v-range-slider
            v-model="dateRange"
            :min="0"
            :max="Math.max(allDates.length - 1, 0)"
            :step="1"
            color="teal"
            track-color="surface-variant"
            density="compact"
            hide-details
            thumb-size="12"
            :disabled="allDates.length < 2"
          />
          <div class="d-flex justify-space-between text-caption text-medium-emphasis mt-1">
            <span>{{ allDates[0] ?? '—' }}</span>
            <span>{{ allDates[allDates.length - 1] ?? '—' }}</span>
          </div>
        </v-card>

        <!-- Location list -->
        <div class="location-list">
          <v-list density="compact" class="pa-0">
            <v-list-item
              v-for="loc in visibleLocations"
              :key="loc.name"
              :active="selectedName === loc.name"
              active-color="teal"
              class="location-list-item rounded mb-1"
              @click="selectLocation(loc.name)"
            >
              <template #prepend>
                <v-icon :color="loc.lat != null ? 'teal' : 'grey'" size="18">
                  {{ loc.lat != null ? 'mdi-map-marker' : 'mdi-map-marker-question' }}
                </v-icon>
              </template>
              <v-list-item-title class="text-body-2">{{ loc.name }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption">
                <span v-if="loc.mentionedInDates?.length">
                  {{ loc.mentionedInDates.length }} note{{ loc.mentionedInDates.length !== 1 ? 's' : '' }}
                  · {{ loc.mentionedInDates[loc.mentionedInDates.length - 1] }}
                </span>
                <span v-else-if="loc.lat != null">{{ loc.lat.toFixed(3) }}, {{ loc.lng!.toFixed(3) }}</span>
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
            <v-list-item v-if="visibleLocations.length === 0 && !pending">
              <v-list-item-title class="text-caption text-medium-emphasis">
                No locations in this time range
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
            :locations="visibleLocations"
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

const { data: locations, pending } = useFetch<LocationMeta[]>('/api/locations/map', {
  server: false,
  lazy: true,
  default: () => [],
})

const searchQuery = ref<string | null>('')
const selectedName = ref<string | undefined>(undefined)
const mapViewRef = ref<{ panTo?: (name: string) => void } | null>(null)

// ── Date range derived from all distinct dates across all location mentions ──
const allDates = computed<string[]>(() => {
  const dateSet = new Set<string>()
  for (const loc of (locations.value ?? [])) {
    for (const d of (loc.mentionedInDates ?? [])) dateSet.add(d)
  }
  return [...dateSet].sort()
})

const dateRange = ref<[number, number]>([0, 0])
watch(allDates, (dates) => {
  dateRange.value = [0, Math.max(dates.length - 1, 0)]
}, { immediate: true })

const sliderStartDate = computed(() => allDates.value[dateRange.value[0]] ?? '—')
const sliderEndDate = computed(() => allDates.value[dateRange.value[1]] ?? '—')

const timeFiltered = computed(() =>
  allDates.value.length > 0 &&
  (dateRange.value[0] !== 0 || dateRange.value[1] !== allDates.value.length - 1),
)

function resetTimeFilter() {
  dateRange.value = [0, Math.max(allDates.value.length - 1, 0)]
}

// ── Filtering ─────────────────────────────────────────────────────────────────
const allGeocodedCount = computed(() =>
  (locations.value ?? []).filter(l => l.lat != null).length,
)

const visibleLocations = computed<LocationMeta[]>(() => {
  const q = searchQuery.value?.trim().toLowerCase() ?? ''
  const startDate = sliderStartDate.value
  const endDate = sliderEndDate.value
  const hasTimeFilter = allDates.value.length > 0

  return (locations.value ?? []).filter(loc => {
    // Text search
    if (q && !loc.name.toLowerCase().includes(q) && !loc.tags.some(t => t.includes(q))) return false

    // Time filter: keep if location has at least one mention within the selected range
    if (hasTimeFilter && loc.mentionedInDates && loc.mentionedInDates.length > 0) {
      const inRange = loc.mentionedInDates.some(d => d >= startDate && d <= endDate)
      if (!inRange) return false
    }

    return true
  })
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
  width: 280px;
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
