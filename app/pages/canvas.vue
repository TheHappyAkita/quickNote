<template>
  <v-container fluid class="pa-4 pa-sm-6">
    <div class="d-flex align-center flex-wrap gap-2 mb-4">
      <v-icon color="primary">mdi-view-dashboard-outline</v-icon>

      <template v-if="!renaming">
        <v-menu>
          <template #activator="{ props: mp }">
            <v-btn
              v-bind="mp"
              variant="text"
              class="text-h6 text-primary font-weight-bold px-1"
              append-icon="mdi-chevron-down"
            >{{ currentMeta?.name }}</v-btn>
          </template>
          <v-list min-width="200">
            <v-list-item
              v-for="c in canvasList"
              :key="c.id"
              :title="c.name"
              :active="c.id === selectedId"
              active-color="primary"
              @click="selectedId = c.id"
            />
            <v-divider />
            <v-list-item title="New canvas…" prepend-icon="mdi-plus" @click="createDialog = true" />
          </v-list>
        </v-menu>
      </template>

      <template v-else>
        <v-text-field
          v-model="renameInput"
          density="compact"
          variant="outlined"
          hide-details
          autofocus
          style="max-width:200px"
          @keydown.enter="submitRename"
          @keydown.escape="renaming = false"
        />
        <v-btn icon="mdi-check" size="small" variant="text" color="primary" @click="submitRename" />
        <v-btn icon="mdi-close" size="small" variant="text" @click="renaming = false" />
      </template>

      <v-btn icon="mdi-pencil-outline" size="small" variant="text" title="Rename" @click="startRename" />
      <v-btn
        icon="mdi-delete-outline"
        size="small"
        variant="text"
        color="error"
        title="Delete canvas"
        :disabled="canvasList.length <= 1"
        @click="deleteDialog = true"
      />

      <v-spacer />
      <v-chip size="small" variant="tonal" color="primary">
        {{ canvasState?.cards?.length ?? 0 }} cards
      </v-chip>
    </div>

    <!-- Create dialog -->
    <v-dialog v-model="createDialog" max-width="360">
      <v-card>
        <v-card-title>New Canvas</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="createName"
            label="Canvas name"
            variant="outlined"
            autofocus
            hide-details
            @keydown.enter="submitCreate"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="createDialog = false">Cancel</v-btn>
          <v-btn variant="flat" color="primary" :loading="createLoading" @click="submitCreate">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete confirm dialog -->
    <v-dialog v-model="deleteDialog" max-width="360">
      <v-card>
        <v-card-title>Delete Canvas</v-card-title>
        <v-card-text>Delete "{{ currentMeta?.name }}"? This cannot be undone.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn variant="flat" color="error" @click="submitDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <ClientOnly>
      <CanvasView
        v-if="canvasState"
        :key="selectedId"
        :canvas-id="selectedId"
        :initial-state="canvasState"
        :all-dates="allDates ?? []"
        :previews="previews ?? {}"
      />
      <template #fallback>
        <div class="d-flex justify-center align-center" style="height: 60vh">
          <v-progress-circular indeterminate color="primary" />
        </div>
      </template>
    </ClientOnly>
  </v-container>
</template>

<script setup lang="ts">
import type { CanvasState, CanvasMeta } from '#shared/types/notes'

const { data: listData } = await useFetch<CanvasMeta[]>('/api/canvas')
const canvasList = ref<CanvasMeta[]>(listData.value ?? [])
const selectedId = ref(canvasList.value[0]?.id ?? 'default')
const currentMeta = computed(() => canvasList.value.find((c) => c.id === selectedId.value))

useHead({
  title: computed(() => currentMeta.value?.name ? `Canvas: ${currentMeta.value.name}` : 'Canvas'),
})

const { data: canvasState } = await useFetch<CanvasState>(() => `/api/canvas/${selectedId.value}`)
const { data: allDates } = await useFetch<string[]>('/api/notes')
const { data: previews } = await useFetch<Record<string, string>>('/api/notes/previews')

watch(selectedId, () => {
  canvasState.value = undefined
})

const renaming = ref(false)
const renameInput = ref('')
const createDialog = ref(false)
const createName = ref('')
const createLoading = ref(false)
const deleteDialog = ref(false)

function startRename() {
  renameInput.value = currentMeta.value?.name ?? ''
  renaming.value = true
}

async function submitRename() {
  if (!renameInput.value.trim()) return
  const updated = await $fetch<CanvasMeta>(`/api/canvas/${selectedId.value}`, {
    method: 'PATCH',
    body: { name: renameInput.value.trim() },
  })
  const idx = canvasList.value.findIndex((c) => c.id === selectedId.value)
  if (idx !== -1) canvasList.value[idx] = updated
  renaming.value = false
}

async function submitCreate() {
  if (!createName.value.trim()) return
  createLoading.value = true
  try {
    const meta = await $fetch<CanvasMeta>('/api/canvas', {
      method: 'POST',
      body: { name: createName.value.trim() },
    })
    canvasList.value.push(meta)
    selectedId.value = meta.id
    createDialog.value = false
    createName.value = ''
  } finally {
    createLoading.value = false
  }
}

async function submitDelete() {
  await $fetch(`/api/canvas/${selectedId.value}`, { method: 'DELETE' as 'GET' })
  canvasList.value = canvasList.value.filter((c) => c.id !== selectedId.value)
  selectedId.value = canvasList.value[0]?.id ?? 'default'
  deleteDialog.value = false
}
</script>
