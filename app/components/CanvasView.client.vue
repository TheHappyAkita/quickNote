<template>
  <div class="canvas-wrapper">
    <div class="canvas-toolbar pa-2 d-flex align-center gap-2">
      <template v-if="addMode">
        <v-text-field
          ref="addInputRef"
          v-model="addInput"
          :placeholder="addMode === 'url' ? 'https://example.com' : 'https://example.com/image.png'"
          :prepend-inner-icon="addMode === 'url' ? 'mdi-web' : 'mdi-image-outline'"
          density="compact"
          variant="outlined"
          hide-details
          style="min-width:240px"
          :loading="addLoading"
          :disabled="addLoading"
          @keydown.enter="submitAdd"
          @keydown.escape="cancelAdd"
        />
        <v-btn size="small" color="primary" variant="flat" :loading="addLoading" @click="submitAdd">Add</v-btn>
        <v-btn size="small" variant="text" icon="mdi-close" @click="cancelAdd" />
      </template>

      <template v-else>
        <v-menu>
          <template #activator="{ props: menuProps }">
            <v-btn v-bind="menuProps" prepend-icon="mdi-calendar-plus" size="small" color="primary" variant="tonal">
              Note
            </v-btn>
          </template>
          <v-list max-height="300" style="overflow-y:auto">
            <v-list-subheader>Pick a note to add</v-list-subheader>
            <v-list-item
              v-for="date in availableDates"
              :key="date"
              :title="date"
              density="compact"
              prepend-icon="mdi-calendar"
              @click="addCard(date)"
            />
            <v-list-item v-if="availableDates.length === 0" title="No notes yet" disabled />
          </v-list>
        </v-menu>

        <v-btn prepend-icon="mdi-web" size="small" variant="tonal" @click="startAdd('url')">URL</v-btn>
        <v-btn prepend-icon="mdi-image-outline" size="small" variant="tonal" @click="startAdd('image')">Image</v-btn>

        <v-btn
          :color="connectMode ? 'warning' : 'default'"
          :variant="connectMode ? 'flat' : 'tonal'"
          prepend-icon="mdi-vector-line"
          size="small"
          @click="toggleConnectMode"
        >
          {{ connectMode ? 'Cancel' : 'Connect' }}
        </v-btn>

        <v-btn
          size="small"
          variant="tonal"
          prepend-icon="mdi-delete-outline"
          :disabled="selectedIds.length === 0"
          @click="deleteSelected"
        >
          Delete
        </v-btn>
      </template>

      <v-spacer />

      <v-chip v-if="connectMode" color="warning" size="small" variant="tonal">
        {{ connectSource ? 'Click target node' : 'Click source node' }}
      </v-chip>

      <v-chip v-if="saveStatus" :color="saveStatus === 'saved' ? 'success' : 'primary'" size="small" variant="tonal">
        {{ saveStatus === 'saving' ? 'Saving…' : 'Saved' }}
      </v-chip>

      <v-btn icon="mdi-fit-to-screen" size="small" variant="text" title="Fit all" @click="fitAll" />
    </div>

    <div class="canvas-area">
      <div ref="containerRef" class="canvas-container" />
      <div
        v-if="popup"
        class="note-popup"
        :style="{ left: popup.x + 'px', top: popup.y + 'px' }"
      >
        <template v-if="popup.type === 'note'">
          <div class="popup-date">{{ popup.date }}</div>
          <div class="popup-preview">{{ popup.notePreview || '(empty note)' }}</div>
          <div class="popup-hint">Click to open</div>
        </template>
        <template v-else-if="popup.type === 'url'">
          <img v-if="popup.ogImage" :src="popup.ogImage" class="popup-og-image" />
          <div class="popup-date">{{ popup.title }}</div>
          <div v-if="popup.description" class="popup-preview">{{ popup.description }}</div>
          <div class="popup-hint">{{ popup.url }}</div>
        </template>
        <template v-else-if="popup.type === 'image'">
          <img :src="popup.src" class="popup-img-preview" />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import cytoscape from 'cytoscape'
import type { Core, NodeSingular } from 'cytoscape'
import type { CanvasState, CanvasCard } from '#shared/types/notes'

const props = defineProps<{
  canvasId: string
  initialState: CanvasState
  allDates: string[]
  previews: Record<string, string>
}>()

// Snapshot the ID at component creation. With :key="canvasId" each instance
// owns exactly one canvas, so we must never follow reactive prop changes here.
const ownCanvasId = props.canvasId

type Popup =
  | { type: 'note'; date: string; notePreview: string; x: number; y: number }
  | { type: 'url'; url: string; title: string; description: string; ogImage: string; x: number; y: number }
  | { type: 'image'; src: string; x: number; y: number }
const popup = ref<Popup | null>(null)
const addMode = ref<'url' | 'image' | null>(null)
const addInput = ref('')
const addLoading = ref(false)
const addInputRef = ref<{ $el: HTMLElement } | null>(null)

const emit = defineEmits<{ 'update:state': [state: CanvasState] }>()

const containerRef = ref<HTMLDivElement | null>(null)
const router = useRouter()
const connectMode = ref(false)
const connectSource = ref<string | null>(null)
const selectedIds = ref<string[]>([])
const saveStatus = ref<'saving' | 'saved' | null>(null)
let cy: Core | null = null
let saveTimer: ReturnType<typeof setTimeout> | null = null

const availableDates = computed(() =>
  props.allDates.filter((d) => !cy?.getElementById(d).length)
)

function getDomain(url: string): string {
  try { return new URL(url).hostname } catch { return url }
}

function noteLabelFor(date: string): string {
  const preview = props.previews[date]
  if (!preview) return date
  const short = preview.length > 55 ? preview.slice(0, 52) + '\u2026' : preview
  return `${date}\n${short}`
}

function cardNodeData(c: CanvasCard): Record<string, unknown> {
  if (c.type === 'url') {
    const domain = getDomain(c.url)
    return { id: c.id, type: 'url', url: c.url, urlTitle: c.title, description: c.description, image: c.image, label: `${c.title || domain}\n${domain}` }
  }
  if (c.type === 'image') {
    return { id: c.id, type: 'image', src: c.src, label: '' }
  }
  return { id: c.id, type: 'note', date: c.date, label: noteLabelFor(c.date) }
}

function buildElements(state: CanvasState) {
  return [
    ...state.cards.map((c) => ({
      data: cardNodeData(c),
      position: { x: c.x, y: c.y },
    })),
    ...state.edges.map((e) => ({
      data: { id: e.id, source: e.source, target: e.target },
    })),
  ]
}

onMounted(() => {
  if (!containerRef.value) return

  cy = cytoscape({
    container: containerRef.value,
    elements: buildElements(props.initialState),
    style: [
      {
        selector: 'node',
        style: {
          'shape': 'round-rectangle',
          'background-color': '#1a1a2e',
          'border-color': '#6c63ff',
          'border-width': 2,
          'label': 'data(label)',
          'color': '#c4b5fd',
          'font-size': 11,
          'font-weight': 'bold',
          'text-valign': 'center',
          'text-halign': 'center',
          'text-wrap': 'wrap',
          'text-max-width': '130px',
          'width': 150,
          'height': 72,
        },
      },
      {
        selector: 'node:selected',
        style: {
          'border-color': '#f59e0b',
          'border-width': 3,
          'background-color': '#2a1f40',
        },
      },
      {
        selector: 'node.connect-source',
        style: {
          'border-color': '#f59e0b',
          'border-width': 3,
          'background-color': '#2a1f10',
        },
      },
      {
        selector: 'node:hover',
        style: {
          'border-color': '#9c8fff',
          'background-color': '#1e1e38',
        },
      },
      {
        selector: 'edge',
        style: {
          'width': 2,
          'line-color': '#4c4c8a',
          'target-arrow-color': '#6c63ff',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
        },
      },
      {
        selector: 'node[type="url"]',
        style: {
          'background-color': '#0f1f3d',
          'border-color': '#3b82f6',
        },
      },
      {
        selector: 'node[type="image"]',
        style: {
          'background-color': '#111827',
          'background-image': 'data(src)',
          'background-fit': 'cover',
          'background-clip': 'node',
          'border-color': '#6b7280',
          'label': '',
          'width': 180,
          'height': 120,
        },
      },
      {
        selector: 'edge:selected',
        style: { 'line-color': '#f59e0b', 'target-arrow-color': '#f59e0b' },
      },
    ],
    layout: { name: 'preset' },
    userZoomingEnabled: true,
    userPanningEnabled: true,
    boxSelectionEnabled: true,
  })

  cy.on('tap', 'node', (event) => {
    const node = event.target as NodeSingular
    const id = node.data('id') as string

    if (connectMode.value) {
      if (!connectSource.value) {
        connectSource.value = id
        node.addClass('connect-source')
      } else if (connectSource.value !== id) {
        const src = connectSource.value
        const edgeId = `${src}--${id}`
        if (!cy?.getElementById(edgeId).length) {
          cy?.add({ data: { id: edgeId, source: src, target: id } })
          scheduleSave()
        }
        cy?.getElementById(src).removeClass('connect-source')
        connectSource.value = null
        connectMode.value = false
      }
      return
    }

    const nodeType = node.data('type') as string
    if (nodeType === 'note') {
      router.push(`/note/${id}`)
    } else if (nodeType === 'url') {
      window.open(node.data('url') as string, '_blank', 'noopener')
    }
  })

  cy.on('select', 'node, edge', () => {
    selectedIds.value = cy?.elements(':selected').map((el) => el.data('id') as string) ?? []
  })

  cy.on('unselect', () => {
    selectedIds.value = cy?.elements(':selected').map((el) => el.data('id') as string) ?? []
  })

  cy.on('dragfree', 'node', () => {
    scheduleSave()
  })

  cy.on('mouseover', 'node', (event) => {
    const node = event.target as NodeSingular
    const nodeType = node.data('type') as string
    const rp = node.renderedPosition()
    const x = rp.x + 80
    const y = rp.y - 60
    if (nodeType === 'url') {
      popup.value = { type: 'url', url: node.data('url') as string, title: node.data('urlTitle') as string, description: node.data('description') as string, ogImage: node.data('image') as string, x, y }
    } else if (nodeType === 'image') {
      popup.value = { type: 'image', src: node.data('src') as string, x, y }
    } else {
      const id = node.data('id') as string
      popup.value = { type: 'note', date: id, notePreview: props.previews[id] ?? '', x, y }
    }
  })

  cy.on('mouseout', 'node', () => {
    popup.value = null
  })
})

onUnmounted(() => {
  if (saveTimer !== null) {
    clearTimeout(saveTimer)
    saveTimer = null
    if (cy) {
      const state = getState()
      $fetch(`/api/canvas/${ownCanvasId}`, { method: 'PUT' as 'GET', body: state }).catch(() => {})
    }
  }
  cy?.destroy()
  cy = null
})

function centerPos() {
  const e = cy?.extent() ?? { x1: 0, x2: 400, y1: 0, y2: 300 }
  return {
    x: (e.x1 + e.x2) / 2 + (Math.random() - 0.5) * 200,
    y: (e.y1 + e.y2) / 2 + (Math.random() - 0.5) * 200,
  }
}

function addCard(date: string) {
  if (!cy) return
  cy.add({ data: { id: date, type: 'note', date, label: noteLabelFor(date) }, position: centerPos() })
  scheduleSave()
}

function startAdd(mode: 'url' | 'image') {
  addMode.value = mode
  addInput.value = ''
  nextTick(() => {
    const el = addInputRef.value?.$el?.querySelector('input') as HTMLInputElement | null
    el?.focus()
  })
}

function cancelAdd() {
  addMode.value = null
  addInput.value = ''
}

async function submitAdd() {
  const raw = addInput.value.trim()
  if (!raw) return
  if (addMode.value === 'url') await addUrlCard(raw)
  else if (addMode.value === 'image') addImageCard(raw)
}

async function addUrlCard(url: string) {
  if (!cy) return
  addLoading.value = true
  try {
    const og = await $fetch<{ url: string; title: string; description: string; image: string }>(`/api/canvas/ogpreview?url=${encodeURIComponent(url)}`)
    const id = `url-${Date.now()}`
    const domain = getDomain(url)
    cy.add({ data: { id, type: 'url', url: og.url, urlTitle: og.title, description: og.description, image: og.image, label: `${og.title || domain}\n${domain}` }, position: centerPos() })
    scheduleSave()
    cancelAdd()
  } catch { /* leave input open on error */ } finally {
    addLoading.value = false
  }
}

function addImageCard(src: string) {
  if (!cy) return
  const id = `img-${Date.now()}`
  cy.add({ data: { id, type: 'image', src, label: '' }, position: centerPos() })
  scheduleSave()
  cancelAdd()
}

function deleteSelected() {
  cy?.elements(':selected').remove()
  selectedIds.value = []
  scheduleSave()
}

function toggleConnectMode() {
  connectMode.value = !connectMode.value
  if (!connectMode.value && connectSource.value) {
    cy?.getElementById(connectSource.value).removeClass('connect-source')
    connectSource.value = null
  }
}

function fitAll() {
  cy?.fit(undefined, 48)
}

function getState(): CanvasState {
  if (!cy) return { cards: [], edges: [] }
  const cards: CanvasCard[] = cy.nodes().map((n) => {
    const id = n.data('id') as string
    const nodeType = n.data('type') as string
    const x = Math.round(n.position('x'))
    const y = Math.round(n.position('y'))
    if (nodeType === 'url') {
      return { id, type: 'url', url: n.data('url') as string, title: n.data('urlTitle') as string, description: n.data('description') as string, image: n.data('image') as string, x, y }
    }
    if (nodeType === 'image') {
      return { id, type: 'image', src: n.data('src') as string, x, y }
    }
    return { id, type: 'note', date: (n.data('date') as string) || id, x, y }
  })
  const edges = cy.edges().map((e) => ({
    id: e.data('id') as string,
    source: e.data('source') as string,
    target: e.data('target') as string,
  }))
  return { cards, edges }
}

async function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => {
    saveStatus.value = 'saving'
    try {
      const state = getState()
      await $fetch(`/api/canvas/${ownCanvasId}`, { method: 'PUT' as 'GET', body: state })
      emit('update:state', state)
      saveStatus.value = 'saved'
      setTimeout(() => { saveStatus.value = null }, 2000)
    } catch {
      saveStatus.value = null
    }
  }, 800)
}
</script>

<style scoped>
.canvas-wrapper {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 148px);
}

.canvas-toolbar {
  background: #1a1a2e;
  border: 1px solid #2e2e4e;
  border-radius: 8px 8px 0 0;
  flex-shrink: 0;
}

.canvas-area {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.canvas-container {
  width: 100%;
  height: 100%;
  background: #0f0f17;
  border: 1px solid #2e2e4e;
  border-top: none;
  border-radius: 0 0 8px 8px;
}

.note-popup {
  position: absolute;
  z-index: 10;
  min-width: 200px;
  max-width: 280px;
  background: #1e1e38;
  border: 1px solid #6c63ff;
  border-radius: 8px;
  padding: 10px 12px;
  pointer-events: none;
  box-shadow: 0 4px 16px rgba(0,0,0,0.5);
}

.popup-date {
  font-size: 12px;
  font-weight: bold;
  color: #c4b5fd;
  margin-bottom: 4px;
}

.popup-preview {
  font-size: 11px;
  color: #a0a0c0;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.popup-hint {
  margin-top: 6px;
  font-size: 10px;
  color: #6c63ff;
  opacity: 0.7;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.popup-og-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 6px;
  display: block;
}

.popup-img-preview {
  width: 100%;
  max-height: 200px;
  object-fit: contain;
  border-radius: 4px;
  display: block;
}
</style>
