<template>
  <div class="graph-wrapper">
    <div ref="containerRef" class="graph-container" />
    <div class="graph-controls">
      <v-btn icon="mdi-fit-to-screen" size="small" variant="tonal" title="Fit to screen" @click="fitGraph" />
      <v-btn icon="mdi-plus" size="small" variant="tonal" title="Zoom in" @click="zoomIn" />
      <v-btn icon="mdi-minus" size="small" variant="tonal" title="Zoom out" @click="zoomOut" />
    </div>
    <div v-if="hoveredNode" class="graph-tooltip">
      {{ hoveredNode }}
    </div>
  </div>
</template>

<script setup lang="ts">
import cytoscape from 'cytoscape'
import type { Core } from 'cytoscape'
import type { GraphData } from '#shared/types/notes'

const props = defineProps<{
  graphData: GraphData
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const hoveredNode = ref<string | null>(null)
let cy: Core | null = null
let resizeObserver: ResizeObserver | null = null

const router = useRouter()

function updateElements() {
  if (!cy) return
  cy.elements().remove()
  cy.add([...props.graphData.nodes, ...props.graphData.edges])
  cy.layout({
    name: 'cose',
    animate: true,
    randomize: true,
    componentSpacing: 100,
    nodeRepulsion: 400000,
    idealEdgeLength: 100,
    edgeElasticity: 100,
    gravity: 80,
    stop: () => cy?.fit(undefined, 40),
  }).run()
}

watch(() => props.graphData, updateElements, { deep: true })

onMounted(() => {
  if (!containerRef.value) return

  // requestAnimationFrame fires just before the next browser paint,
  // guaranteeing that layout has been computed and the container has
  // real dimensions (getBoundingClientRect returns non-zero values).
  requestAnimationFrame(() => {
  if (!containerRef.value) return

  cy = cytoscape({
    container: containerRef.value,
    elements: [],
    minZoom: 0.05,
    maxZoom: 5,
    style: [
      {
        selector: 'node',
        style: {
          'label': 'data(label)',
          'color': '#ffffff',
          'text-valign': 'center',
          'text-halign': 'center',
          'text-outline-width': 1,
          'text-outline-color': '#0f0f17',
        },
      },
      {
        selector: 'node[type="date"]',
        style: {
          'background-color': '#6c63ff',
          'border-color': '#2e2e4e',
          'border-width': 2,
          'font-size': 11,
          'width': 44,
          'height': 44,
        },
      },
      {
        selector: 'node[type="page"]',
        style: {
          'background-color': '#1e2e3e',
          'border-color': '#9c8fff',
          'border-width': 2,
          'border-style': 'dashed',
          'font-size': 10,
          'width': 44,
          'height': 44,
        },
      },
      {
        selector: 'node[type="person"]',
        style: {
          'background-color': '#4a2c40',
          'border-color': '#f06292',
          'border-width': 2,
          'font-size': 10,
          'shape': 'ellipse',
          'width': 48,
          'height': 48,
          'color': '#f8bbd0',
          'text-outline-color': '#2a1020',
        },
      },
      {
        selector: 'node[type="keyword"]',
        style: {
          'background-color': '#1a6b5a',
          'border-color': '#2dd4bf',
          'border-width': 1.5,
          'font-size': 10,
          'shape': 'round-rectangle',
          'width': 60,
          'height': 24,
          'padding': '6px',
          'color': '#a7f3d0',
          'text-outline-color': '#0f1f1a',
        },
      },
      {
        selector: 'node[type="page"]:hover',
        style: { 'background-color': '#2e3e4e', 'border-color': '#b8a5ff' },
      },
      {
        selector: 'node:selected',
        style: { 'background-color': '#ff6b6b', 'border-color': '#ff6b6b' },
      },
      {
        selector: 'node:hover',
        style: { 'background-color': '#9c8fff', 'border-color': '#6c63ff' },
      },
      {
        selector: 'node[type="keyword"]:hover',
        style: { 'background-color': '#0d9488', 'border-color': '#2dd4bf' },
      },
      {
        selector: 'edge[type="wikilink"]',
        style: {
          'width': 2,
          'line-color': '#4c4c8a',
          'target-arrow-color': '#6c63ff',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'opacity': 0.9,
        },
      },
      {
        selector: 'edge[type="keyword"]',
        style: {
          'width': 1,
          'line-color': '#134e4a',
          'line-style': 'dashed',
          'target-arrow-shape': 'none',
          'curve-style': 'bezier',
          'opacity': 0.5,
        },
      },
      {
        selector: 'edge:selected',
        style: { 'line-color': '#6c63ff', 'width': 2.5, 'opacity': 1 },
      },
      {
        selector: 'node[?dimmed]',
        style: { 'opacity': 0.45 },
      },
      {
        selector: 'edge[?dimmed]',
        style: { 'opacity': 0.2 },
      },
    ],
  })

  // Ensure Cytoscape reads the true container dimensions after DOM layout
  cy.resize()

  // Keep Cytoscape in sync when the container is resized (e.g. window resize)
  resizeObserver = new ResizeObserver(() => cy?.resize())
  resizeObserver.observe(containerRef.value)

  cy.on('tap', 'node[type="date"]', (event) => {
    const date = event.target.data('id') as string
    router.push(`/note/${date}`)
  })

  cy.on('tap', 'node[type="page"]', (event) => {
    const id = event.target.data('id') as string
    const pageName = id.replace(/^page:/, '')
    router.push(`/page/${encodeURIComponent(pageName)}`)
  })

  cy.on('mouseover', 'node', (event) => {
    const node = event.target
    const type = node.data('type') as string
    const id = node.data('id') as string
    const label = node.data('label') as string
    if (type === 'date') {
      hoveredNode.value = id
    } else if (type === 'page') {
      hoveredNode.value = `📄 ${label}`
    } else if (type === 'person') {
      hoveredNode.value = `👤 ${label}`
    } else {
      hoveredNode.value = `#${label}`
    }
  })

  cy.on('mouseout', 'node', () => {
    hoveredNode.value = null
  })

  cy.on('tap', 'node[type="person"]', (event) => {
    const label = event.target.data('label') as string
    router.push(`/person/${encodeURIComponent(label)}`)
  })

  // Always run the cose layout with current data — this is the only place
  // that positions nodes. The watch() above only fires on *subsequent* changes,
  // so without this call the graph would be blank on initial mount (F5 / first load).
  updateElements()
  }) // end requestAnimationFrame
}) // end onMounted

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  cy?.destroy()
  cy = null
})

function fitGraph() {
  cy?.fit(undefined, 40)
}

defineExpose({ fitGraph })

function zoomIn() {
  if (!cy) return
  cy.zoom({ level: cy.zoom() * 1.3, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } })
}

function zoomOut() {
  if (!cy) return
  cy.zoom({ level: cy.zoom() / 1.3, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } })
}
</script>

<style scoped>
.graph-wrapper {
  position: relative;
  width: 100%;
  height: calc(100vh - 148px);
}

.graph-container {
  width: 100%;
  height: 100%;
  background: #0f0f17;
  border-radius: 8px;
  border: 1px solid #2e2e4e;
}

.graph-controls {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 10;
}

.graph-tooltip {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: #1a1a2e;
  border: 1px solid #6c63ff;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  color: #9c8fff;
  pointer-events: none;
  z-index: 10;
}
</style>
