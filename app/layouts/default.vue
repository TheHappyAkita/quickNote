<template>
  <v-app>
    <AppNav />
    <v-main class="bg-background">
      <slot />
    </v-main>
    <RemindersPanel />
  </v-app>
</template>
