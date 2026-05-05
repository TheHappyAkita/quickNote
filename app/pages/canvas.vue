<template>
  <v-container fluid class="pa-4 pa-sm-6">
    <div class="d-flex align-center mb-4">
      <v-icon color="primary" class="mr-2">mdi-view-dashboard-outline</v-icon>
      <h1 class="text-h6 text-primary font-weight-bold">Canvas</h1>
      <v-spacer />
      <v-chip size="small" variant="tonal" color="primary">
        {{ canvasState?.cards?.length ?? 0 }} cards
      </v-chip>
    </div>

    <ClientOnly>
      <CanvasView
        v-if="canvasState"
        :initial-state="canvasState"
        :all-dates="allDates ?? []"
        :previews="previews ?? {}"
        @update:state="canvasState = $event"
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
import type { CanvasState } from '#shared/types/notes'

const { data: canvasState } = await useFetch<CanvasState>('/api/canvas')
const { data: allDates } = await useFetch<string[]>('/api/notes')
const { data: previews } = await useFetch<Record<string, string>>('/api/notes/previews')
</script>
