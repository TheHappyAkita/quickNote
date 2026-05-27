<!-- Copyright (C) 2026 TheHappyAkita - SPDX-License-Identifier: GPL-3.0-only -->
<template>
  <v-app>
    <v-main class="bg-background d-flex align-center justify-center" style="min-height: 100vh">
      <v-card
        class="pa-8"
        width="400"
        style="background: #1A1A2E; border: 1px solid #333"
        elevation="0"
      >
        <div class="text-center mb-6">
          <div class="text-h4 font-weight-bold">
            <span class="text-primary">quick</span><span class="text-white">Note</span>
          </div>
          <div class="text-caption text-medium-emphasis mt-1">Your personal knowledge base</div>
        </div>

        <v-form @submit.prevent="handleLogin">
          <v-text-field
            v-model="username"
            label="Username"
            variant="outlined"
            prepend-inner-icon="mdi-account"
            class="mb-3"
            :disabled="loading"
            autofocus
          />
          <v-text-field
            v-model="password"
            label="Password"
            type="password"
            variant="outlined"
            prepend-inner-icon="mdi-lock"
            class="mb-5"
            :disabled="loading"
          />
          <v-btn
            type="submit"
            color="primary"
            block
            size="large"
            :loading="loading"
          >
            Sign In
          </v-btn>
        </v-form>

        <v-alert
          v-if="error"
          type="error"
          class="mt-4"
          variant="tonal"
          density="compact"
        >
          {{ error }}
        </v-alert>
      </v-card>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { loggedIn } = useUserSession()

if (loggedIn.value) {
  await navigateTo('/')
}

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { username: username.value, password: password.value },
    })
    window.location.replace('/')
  } catch (err: unknown) {
    error.value = (err as { data?: { message?: string } })?.data?.message ?? 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>
