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
</script>

<style>
html,
body {
  overflow: hidden;
  height: 100%;
}
</style>
