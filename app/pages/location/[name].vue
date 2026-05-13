<template>
  <v-container fluid class="pa-4 pa-sm-6">
    <div class="editor-page">
      <div class="d-flex align-center mb-4">
        <v-btn icon variant="text" size="small" class="mr-2" to="/locations">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        <v-icon color="teal" class="mr-2">mdi-map-marker</v-icon>
        <h1 class="text-h6 font-weight-bold">{{ locationName }}</h1>
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
          title="Delete location"
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

      <!-- Coordinates row -->
      <v-card variant="outlined" class="mb-3 coords-card">
        <v-card-text class="pa-3">
          <div class="d-flex align-center flex-wrap gap-2">
            <v-text-field
              v-model="coordInput"
              label="Coordinates (DD, DMS, DDM or WKT)"
              density="compact"
              variant="outlined"
              :hint="coordHint"
              persistent-hint
              :error="coordInput !== '' && parsedCoords === null"
              placeholder="e.g. 41.40338, -2.17403"
              class="coord-field"
              @blur="saveCoordsToFrontmatter"
              @keyup.enter="saveCoordsToFrontmatter"
            />
            <v-btn
              color="teal"
              variant="tonal"
              size="small"
              :loading="geocoding"
              prepend-icon="mdi-map-search"
              @click="geocode"
            >
              Geocode
            </v-btn>
            <v-btn
              v-if="hasCoords"
              :to="`/map?lat=${parsedCoords!.lat}&lng=${parsedCoords!.lng}`"
              color="teal"
              variant="text"
              size="small"
              prepend-icon="mdi-map"
            >
              View on map
            </v-btn>
            <span v-if="geocodeError" class="text-caption text-error ml-2">{{ geocodeError }}</span>
          </div>
        </v-card-text>
      </v-card>

      <!-- Mini map preview -->
      <ClientOnly>
        <div v-if="hasCoords" class="mini-map-wrapper mb-3">
          <MapView :locations="[currentLocationMeta]" />
        </div>
      </ClientOnly>

      <NoteEditor v-model="content" @blur="saveNow" />
    </div>
  </v-container>

  <v-dialog v-model="deleteDialog" max-width="400">
    <v-card>
      <v-card-title class="text-h6">Delete Location?</v-card-title>
      <v-card-text>
        Delete "{{ locationName }}"? This cannot be undone.
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
        <v-btn color="error" variant="flat" @click="doDelete">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { LocationMeta } from '#shared/types/notes'
import { parseCoords, formatDD } from '#shared/utils/coords'

const route = useRoute()
const router = useRouter()
const locationName = computed(() => decodeURIComponent(route.params.name as string))

useHead({ title: computed(() => locationName.value) })

const { data: locationData } = await useFetch<{ name: string; content: string }>(
  () => `/api/locations/${encodeURIComponent(locationName.value)}`,
  { server: false },
)

const content = ref(locationData.value?.content ?? '')
const saved = ref(true)
const saving = ref(false)
const deleteDialog = ref(false)
const addingTag = ref(false)
const newTag = ref('')
const tagInputRef = ref<HTMLInputElement | null>(null)
const geocoding = ref(false)
const geocodeError = ref('')

watch(() => locationData.value, (d) => {
  if (d) content.value = d.content
}, { immediate: true })

watch(content, () => { saved.value = false })

// ── Coordinates ──────────────────────────────────────────────────────────────

function parseFrontmatterCoords(raw: string): { lat?: number; lng?: number } {
  if (!raw.startsWith('---')) return {}
  const end = raw.indexOf('\n---', 3)
  if (end === -1) return {}
  const fm = raw.slice(3, end)
  const latM = /^lat:\s*([\-0-9.]+)/m.exec(fm)
  const lngM = /^lng:\s*([\-0-9.]+)/m.exec(fm)
  return {
    lat: latM ? parseFloat(latM[1]!) : undefined,
    lng: lngM ? parseFloat(lngM[1]!) : undefined,
  }
}

const coordInput = ref<string>('')

const parsedCoords = computed(() =>
  coordInput.value.trim() ? parseCoords(coordInput.value.trim()) : null,
)

const coordHint = computed(() => {
  if (!coordInput.value.trim()) return 'DD, DMS, DDM or WKT POINT accepted'
  if (parsedCoords.value) return `→ ${parsedCoords.value.lat.toFixed(6)}, ${parsedCoords.value.lng.toFixed(6)}`
  return 'Unrecognised format'
})

watch(content, (raw) => {
  const c = parseFrontmatterCoords(raw)
  if (c.lat != null && c.lng != null) {
    coordInput.value = formatDD(c.lat, c.lng)
  }
}, { immediate: true })

const hasCoords = computed(() => parsedCoords.value != null)

const currentLocationMeta = computed<LocationMeta>(() => ({
  name: locationName.value,
  tags: currentTags.value,
  lat: parsedCoords.value?.lat,
  lng: parsedCoords.value?.lng,
}))

function upsertFrontmatterField(raw: string, key: string, value: string): string {
  if (raw.startsWith('---')) {
    const end = raw.indexOf('\n---', 3)
    if (end !== -1) {
      const fm = raw.slice(3, end)
      const body = raw.slice(end + 4)
      const keyRe = new RegExp(`^${key}:.*$`, 'm')
      const newFm = keyRe.test(fm)
        ? fm.replace(keyRe, `${key}: ${value}`)
        : fm.trimEnd() + `\n${key}: ${value}`
      return `---${newFm}\n\n---${body}`
    }
  }
  return `---\n${key}: ${value}\n\n---\n\n${raw}`
}

function removeFrontmatterField(raw: string, key: string): string {
  if (!raw.startsWith('---')) return raw
  const end = raw.indexOf('\n---', 3)
  if (end === -1) return raw
  const fm = raw.slice(3, end)
  const body = raw.slice(end + 4)
  const newFm = fm.replace(new RegExp(`\\n?${key}:.*`, 'm'), '')
  return `---${newFm}\n\n---${body}`
}

function saveCoordsToFrontmatter() {
  const coords = parsedCoords.value
  let raw = content.value
  if (coords) {
    raw = upsertFrontmatterField(raw, 'lat', String(coords.lat))
    raw = upsertFrontmatterField(raw, 'lng', String(coords.lng))
  } else {
    raw = removeFrontmatterField(raw, 'lat')
    raw = removeFrontmatterField(raw, 'lng')
  }
  content.value = raw
  saveNow()
}

async function geocode() {
  const query = locationName.value.trim()
  if (!query) return
  geocoding.value = true
  geocodeError.value = ''
  try {
    const results = await $fetch<Array<{ lat: string; lon: string }>>(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en' } },
    )
    if (results.length === 0) {
      geocodeError.value = 'Location not found'
      return
    }
    const lat = parseFloat(results[0]!.lat)
    const lng = parseFloat(results[0]!.lon)
    coordInput.value = formatDD(lat, lng)
    saveCoordsToFrontmatter()
  } catch {
    geocodeError.value = 'Geocoding failed'
  } finally {
    geocoding.value = false
  }
}

// ── Tags ──────────────────────────────────────────────────────────────────────

function parseTags(raw: string): string[] {
  if (!raw.startsWith('---')) return []
  const end = raw.indexOf('\n---', 3)
  if (end === -1) return []
  const fm = raw.slice(3, end)
  const m = /^tags:\s*\[([^\]]*)\]/m.exec(fm)
  if (m) return (m[1] ?? '').split(',').map(t => t.trim()).filter(Boolean)
  const bm = /^tags:\s*\n((?:[ \t]*-[ \t]+[^\n]+\n?)*)/m.exec(fm)
  if (bm) return (bm[1] ?? '').split('\n').map(l => l.replace(/^[ \t]*-[ \t]+/, '').trim()).filter(Boolean)
  return []
}

const currentTags = computed(() => parseTags(content.value))

function setTags(tags: string[]) {
  let raw = content.value
  const tagLine = `tags: [${tags.join(', ')}]`
  if (raw.startsWith('---')) {
    const end = raw.indexOf('\n---', 3)
    if (end !== -1) {
      const fm = raw.slice(3, end)
      const body = raw.slice(end + 4)
      const newFm = /^tags:/m.test(fm)
        ? fm.replace(/^tags:.*$/m, tagLine)
        : `\n${tagLine}` + fm
      content.value = `---${newFm}\n\n---${body}`
      return
    }
  }
  content.value = `---\n${tagLine}\n\n---\n\n${raw}`
}

function removeTag(tag: string) {
  setTags(currentTags.value.filter(t => t !== tag))
  saveNow()
}

function startAddTag() {
  addingTag.value = true
  nextTick(() => (tagInputRef.value as unknown as { focus?: () => void })?.focus?.())
}

function confirmAddTag() {
  const t = newTag.value.trim().toLowerCase().replace(/^#/, '')
  if (t && !currentTags.value.includes(t)) {
    setTags([...currentTags.value, t])
    saveNow()
  }
  newTag.value = ''
  addingTag.value = false
}

// ── Save / Delete ─────────────────────────────────────────────────────────────

async function saveNow() {
  saving.value = true
  try {
    await $fetch(`/api/locations/${encodeURIComponent(locationName.value)}`, {
      method: 'PUT' as 'GET',
      body: { content: content.value },
    })
    saved.value = true
  } finally {
    saving.value = false
  }
}

async function doDelete() {
  await $fetch(`/api/locations/${encodeURIComponent(locationName.value)}`, { method: 'DELETE' as 'GET' })
  deleteDialog.value = false
  router.push('/locations')
}

onMounted(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveNow() }
  }
  document.addEventListener('keydown', handler)
  onUnmounted(() => document.removeEventListener('keydown', handler))
})
</script>

<style scoped>
.editor-page {
  height: calc(100vh - var(--v-layout-top, 64px) - 48px);
  display: flex;
  flex-direction: column;
}

.gap-1 { gap: 4px; }
.tag-input { max-width: 120px; }

.coord-field {
  min-width: 280px;
  flex: 1;
}

.coords-card {
  flex-shrink: 0;
}

.mini-map-wrapper {
  height: 220px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
}
</style>
