<template>
  <v-app>
    <AppNav />
    <v-main class="bg-background" :style="mainStyle">
      <slot />
    </v-main>
    <RemindersPanel @update:collapsed="onPanelCollapse" />
  </v-app>
</template>

<script setup lang="ts">
const panelCollapsed = ref(true)
const mainStyle = computed(() => ({
  // Always reserve 40px for the toggle button area.
  // Panel overlays when open (z-index), content doesn't shift further.
  paddingRight: '40px',
}))

function onPanelCollapse(collapsed: boolean) {
  panelCollapsed.value = collapsed
}
</script>
