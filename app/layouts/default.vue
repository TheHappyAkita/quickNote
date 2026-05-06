<template>
  <v-app>
    <AppNav />
    <v-main class="bg-background" style="padding-right: 40px">
      <slot />
    </v-main>
    <RightSidebar />
  </v-app>
</template>
