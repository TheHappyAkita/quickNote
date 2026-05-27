<!-- Copyright (C) 2026 TheHappyAkita - SPDX-License-Identifier: GPL-3.0-only -->
<template>
  <v-app>
    <AppNav />
    <v-main class="bg-background" style="padding-right: 40px">
      <slot />
    </v-main>
    <RightSidebar />
  </v-app>
</template>
