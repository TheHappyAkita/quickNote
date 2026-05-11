<template>
  <div ref="mapRef" class="map-container" />
</template>

<script setup lang="ts">
import type { LocationMeta } from '#shared/types/notes'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps<{
  locations: LocationMeta[]
  selectedName?: string
}>()

const emit = defineEmits<{
  'select': [name: string]
}>()

const mapRef = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let markers: L.Marker[] = []

// Fix default Leaflet icon paths broken by bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const highlightIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [30, 46],
  iconAnchor: [15, 46],
  popupAnchor: [0, -46],
  className: 'marker-highlight',
})

function renderMarkers() {
  if (!map) return
  markers.forEach(m => m.remove())
  markers = []

  const geocoded = props.locations.filter(l => l.lat != null && l.lng != null)
  if (!geocoded.length) return

  const bounds: [number, number][] = []
  for (const loc of geocoded) {
    const isSelected = loc.name === props.selectedName
    const marker = L.marker([loc.lat!, loc.lng!], {
      icon: isSelected ? highlightIcon : new L.Icon.Default(),
      title: loc.name,
    })
    const dates = loc.mentionedInDates ?? []
    const datesHtml = dates.length
      ? `<br/><span style="color:#aaa;font-size:11px">📅 ${dates.length} note${dates.length !== 1 ? 's' : ''} · last: ${dates[dates.length - 1]}</span>`
      : ''
    marker.bindPopup(`
      <div style="font-family:sans-serif; min-width:140px">
        <strong style="font-size:14px">📍 ${loc.name}</strong>
        ${loc.tags.length ? `<br/><span style="color:#888;font-size:11px">${loc.tags.map(t => '#' + t).join(' ')}</span>` : ''}
        ${datesHtml}
        <br/><a href="/location/${encodeURIComponent(loc.name)}" style="font-size:12px;color:#6c63ff">Open →</a>
      </div>
    `)
    marker.on('click', () => emit('select', loc.name))
    marker.addTo(map!)
    markers.push(marker)
    bounds.push([loc.lat!, loc.lng!])
  }

  if (bounds.length === 1) {
    map.setView(bounds[0]!, 10)
  } else if (bounds.length > 1) {
    map.fitBounds(bounds, { padding: [40, 40] })
  }
}

function panTo(name: string) {
  const loc = props.locations.find(l => l.name === name)
  if (!loc || loc.lat == null || loc.lng == null) return
  map?.setView([loc.lat, loc.lng], Math.max(map.getZoom(), 10), { animate: true })
  markers.find(m => m.options.title === name)?.openPopup()
}

watch(() => props.locations, renderMarkers, { deep: true })
watch(() => props.selectedName, (name) => {
  if (name) panTo(name)
  renderMarkers()
})

onMounted(() => {
  requestAnimationFrame(() => {
    if (!mapRef.value) return
    map = L.map(mapRef.value, { zoomControl: true }).setView([20, 0], 2)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)
    renderMarkers()
  })
})

onUnmounted(() => {
  map?.remove()
  map = null
  markers = []
})

defineExpose({ panTo })
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  border: 1px solid #2e2e4e;
}
</style>
