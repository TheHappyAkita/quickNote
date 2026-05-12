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

onMounted(() => {
  init()
})

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

/* ── Hacker Green theme overrides ─────────────────────────────────────────── */
html.theme-hacker,
html.theme-hacker body,
html.theme-hacker .v-application {
  font-family: 'Courier New', Courier, monospace !important;
  letter-spacing: 0.03em;
}

html.theme-hacker .v-app-bar {
  border-bottom: 1px solid #00FF41 !important;
}

html.theme-hacker .v-card,
html.theme-hacker .v-sheet,
html.theme-hacker .v-list {
  border-color: #00FF41 !important;
}

html.theme-hacker a,
html.theme-hacker .wiki-link {
  color: #00FF41 !important;
}

html.theme-hacker .wiki-link:hover {
  text-shadow: 0 0 6px #00FF41;
}

/* Scanline overlay */
html.theme-hacker .v-main::before {
  content: '';
  pointer-events: none;
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.07) 2px,
    rgba(0, 0, 0, 0.07) 4px
  );
  z-index: 9999;
}

/* Cursor blink on focused inputs */
html.theme-hacker input,
html.theme-hacker textarea {
  caret-color: #00FF41 !important;
}

/* Green text glow on primary elements */
html.theme-hacker .v-btn--active,
html.theme-hacker .v-btn:focus-visible {
  text-shadow: 0 0 8px #00FF41;
}
</style>
