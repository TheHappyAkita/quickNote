<template>
  <div class="search-panel" :class="{ collapsed: isCollapsed }">
    <!-- Search Toggle Button -->
    <v-btn
      icon
      size="small"
      variant="text"
      class="search-toggle-btn"
      :color="isCollapsed ? undefined : 'primary'"
      :title="isCollapsed ? 'Search notes' : 'Close search'"
      @click="toggle"
    >
      <v-icon>{{ isCollapsed ? 'mdi-magnify' : 'mdi-chevron-right' }}</v-icon>
    </v-btn>

    <div v-show="!isCollapsed" class="panel-content">
      <div class="panel-header">
        <v-icon size="18" color="primary" class="mr-2">mdi-magnify</v-icon>
        <span class="font-weight-bold">Search</span>
        <v-spacer />
        <v-btn
          icon="mdi-close"
          size="x-small"
          variant="text"
          @click="isCollapsed = true"
        />
      </div>

      <v-text-field
        v-model="query"
        placeholder="Search notes and pages..."
        variant="outlined"
        density="compact"
        hide-details
        class="search-input mb-3"
        prepend-inner-icon="mdi-magnify"
        clearable
        @keyup.enter="performSearch"
        @update:model-value="debouncedSearch"
      />

      <div v-if="loading" class="d-flex justify-center pa-4">
        <v-progress-circular indeterminate size="20" color="primary" />
      </div>

      <div v-else-if="query.length >= 2 && results.length === 0" class="text-caption text-medium-emphasis pa-2 text-center">
        No results found
      </div>

      <div v-else-if="query.length < 2 && results.length === 0" class="text-caption text-medium-emphasis pa-2 text-center">
        Type at least 2 characters to search
      </div>

      <v-list v-else density="compact" class="result-list">
        <v-list-item
          v-for="result in results"
          :key="`${result.type}-${result.id}`"
          :to="result.type === 'note' ? `/note/${result.id}` : `/page/${encodeURIComponent(result.id)}`"
          class="result-item"
          @click="isCollapsed = true"
        >
          <template #prepend>
            <v-icon v-if="result.type === 'note'" size="16" color="primary" class="mr-2">mdi-calendar</v-icon>
            <v-icon v-else size="16" color="secondary" class="mr-2">mdi-file-document-outline</v-icon>
          </template>

          <v-list-item-title class="text-body-2">
            {{ result.title }}
            <v-chip v-if="result.matches > 1" size="x-small" variant="tonal" color="info" class="ml-2">
              {{ result.matches }}
            </v-chip>
          </v-list-item-title>

          <v-list-item-subtitle class="text-caption excerpt">
            {{ result.excerpt }}
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </div>
  </div>
</template>

<script setup lang="ts">
interface SearchResult {
  type: 'note' | 'page'
  id: string
  title: string
  excerpt: string
  matches: number
}

const isCollapsed = ref(true)
const query = ref('')
const results = ref<SearchResult[]>([])
const loading = ref(false)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function toggle() {
  isCollapsed.value = !isCollapsed.value
  if (!isCollapsed.value) {
    nextTick(() => {
      // Focus the input when opening
      const input = document.querySelector('.search-input input') as HTMLInputElement
      input?.focus()
    })
  }
}

function debouncedSearch() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    performSearch()
  }, 300)
}

async function performSearch() {
  const q = query.value.trim()
  if (q.length < 2) {
    results.value = []
    return
  }

  loading.value = true
  try {
    const data = await $fetch<SearchResult[]>('/api/search', {
      query: { q },
    })
    results.value = data
  } catch (err) {
    console.error('Search failed:', err)
    results.value = []
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.search-panel {
  position: fixed;
  top: 96px; /* Below the reminders panel toggle buttons */
  right: 0;
  width: 340px;
  height: calc(100vh - 120px);
  background: #1a1a2e;
  border-left: 1px solid #2e2e4e;
  z-index: 100;
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
}

.search-panel.collapsed {
  transform: translateX(calc(100% - 40px));
  pointer-events: none;
}

.search-panel.collapsed .search-toggle-btn {
  pointer-events: auto;
}

.search-toggle-btn {
  position: absolute;
  left: 4px;
  top: 8px;
  z-index: 10;
}

.panel-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 12px;
  padding-left: 44px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #2e2e4e;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.result-list {
  flex: 1;
  overflow-y: auto;
  background: transparent !important;
}

.result-item {
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 4px;
}

.result-item:hover {
  background: rgba(108, 99, 255, 0.1);
}

.excerpt {
  white-space: normal;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:deep(.search-input .v-field) {
  background: #0f0f17;
}
</style>
