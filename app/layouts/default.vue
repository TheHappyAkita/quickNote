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
  paddingRight: panelCollapsed.value ? '40px' : '280px',
  transition: 'padding-right 0.2s ease',
}))

function onPanelCollapse(collapsed: boolean) {
  panelCollapsed.value = collapsed
}
</script>
