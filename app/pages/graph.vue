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

const { data: graphData, pending, refresh } = await useFetch<GraphData>('/api/notes/graph')

const searchQuery = ref('')
const graphViewRef = ref<{ fitGraph?: () => void } | null>(null)

const filteredGraphData = computed<GraphData>(() => {
  if (!graphData.value) return { nodes: [], edges: [] }
  if (!searchQuery.value.trim()) return graphData.value

  const query = searchQuery.value.toLowerCase().trim()
  const visibleNodes = new Set<string>()

  // Find nodes matching the query
  const filteredNodes = graphData.value.nodes.filter((node) => {
    const match = node.data.label.toLowerCase().includes(query)
    if (match) visibleNodes.add(node.data.id)
    return match
  })

  // Keep edges where both source and target are visible
  const filteredEdges = graphData.value.edges.filter((edge) => {
    return visibleNodes.has(edge.data.source) && visibleNodes.has(edge.data.target)
  })

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
