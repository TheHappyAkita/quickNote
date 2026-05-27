<!-- Copyright (C) 2026 TheHappyAkita - SPDX-License-Identifier: GPL-3.0-only -->
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} · quickNote` : 'quickNote'
  },
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
  ],
  meta: [
    { name: 'theme-color', content: '#6C63FF' },
  ],
})

const { current, init } = useAppTheme()

// Initialize Vuetify theme from localStorage on mount
onMounted(() => { init() })

// Keep CSS class in sync when theme is changed manually
watch(current, (name) => {
  document.documentElement.classList.toggle('theme-hacker', name === 'hackerGreen')
})
</script>

<style>
html,
body {
  overflow: hidden;
  height: 100%;
}
</style>
