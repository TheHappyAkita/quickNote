<template>
  <v-app>
    <AppNav />
    <v-main class="bg-background" :style="mainStyle">
      <slot />
    </v-main>
    <RemindersPanel ref="remindersPanelRef" @panel-open="onPanelOpen" />
    <SearchPanel ref="searchPanelRef" @panel-open="onPanelOpen" />
  </v-app>
</template>

<script setup lang="ts">
const remindersPanelRef = ref<{ collapse: () => void } | null>(null)
const searchPanelRef = ref<{ collapse: () => void } | null>(null)

function onPanelOpen(panel: string) {
  // Close other panels when one opens
  if (panel === 'search' && remindersPanelRef.value) {
    remindersPanelRef.value.collapse()
  } else if (panel === 'reminders' && searchPanelRef.value) {
    searchPanelRef.value.collapse()
  }
}

const mainStyle = computed(() => ({
  // Always reserve 40px for the toggle button area.
  // Panel overlays when open (z-index), content doesn't shift further.
  paddingRight: '40px',
}))
</script>
