<template>
  <v-container fluid class="pa-4 pa-sm-6">
    <div class="d-flex align-center mb-4">
      <v-icon color="primary" class="mr-2">mdi-graph</v-icon>
      <h1 class="text-h6 text-primary font-weight-bold">Knowledge Graph</h1>
      <v-spacer />
      <v-text-field
        v-model="searchQuery"
        placeholder="Filter nodes..."
        variant="outlined"
        density="compact"
        hide-details
        clearable
        class="search-field mr-2"
        prepend-inner-icon="mdi-filter"
        @update:model-value="filterGraph"
      />
      <v-chip size="small" variant="tonal" color="primary">
        {{ nodeCount.dates }} dates, {{ nodeCount.pages }} pages
      </v-chip>
      <v-btn
        icon="mdi-refresh"
        variant="text"
        size="small"
        class="ml-2"
        :loading="pending"
        @click="refresh"
      />
    </div>

    <v-alert
      v-if="!pending && nodeCount.total === 0"
      type="info"
      variant="tonal"
      class="mb-4"
    >
      No notes yet. Create your first daily note or page to start building your graph.
    </v-alert>

    <ClientOnly>
      <GraphView v-if="graphData" ref="graphViewRef" :graph-data="filteredGraphData" />
      <template #fallback>
        <div class="d-flex justify-center align-center" style="height: 60vh">
          <v-progress-circular indeterminate color="primary" />
        </div>
      </template>
    </ClientOnly>
  </v-container>
</template>

<script setup lang="ts">
import type { GraphData } from '#shared/types/notes'

useHead({
  title: 'Knowledge Graph',
})

const { data: graphData, pending, refresh } = useFetch<GraphData>('/api/notes/graph', { lazy: true })

const searchQuery = ref('')
const graphViewRef = ref<{ fitGraph?: () => void } | null>(null)

const filteredGraphData = computed<GraphData>(() => {
  if (!graphData.value) return { nodes: [], edges: [] }
  if (!searchQuery.value.trim()) return graphData.value

  const query = searchQuery.value.toLowerCase().trim()
  const matchedNodes = new Set<string>()

  // Step 1: find nodes directly matching the query
  for (const node of graphData.value.nodes) {
    if (node.data.label.toLowerCase().includes(query)) {
      matchedNodes.add(node.data.id)
    }
  }

  // Step 2: expand to direct neighbours via any edge
  const visibleNodes = new Set<string>(matchedNodes)
  for (const edge of graphData.value.edges) {
    if (matchedNodes.has(edge.data.source)) visibleNodes.add(edge.data.target)
    if (matchedNodes.has(edge.data.target)) visibleNodes.add(edge.data.source)
  }

  // Step 3: filter nodes and edges
  const filteredNodes = graphData.value.nodes
    .filter(n => visibleNodes.has(n.data.id))
    .map(n => ({
      ...n,
      data: { ...n.data, dimmed: !matchedNodes.has(n.data.id) },
    }))

  const filteredEdges = graphData.value.edges.filter(
    e => visibleNodes.has(e.data.source) && visibleNodes.has(e.data.target),
  )

  return { nodes: filteredNodes, edges: filteredEdges }
})

const nodeCount = computed(() => {
  const nodes = graphData.value?.nodes ?? []
  const dates = nodes.filter(n => n.data.type === 'date').length
  const pages = nodes.filter(n => n.data.type === 'page').length
  return { total: nodes.length, dates, pages }
})

function filterGraph() {
  // Auto-fit when filter changes
  nextTick(() => {
    graphViewRef.value?.fitGraph?.()
  })
}
</script>

<style scoped>
.search-field {
  max-width: 200px;
}
</style>
