<!-- Copyright (C) 2026 TheHappyAkita - SPDX-License-Identifier: GPL-3.0-only -->
<template>
  <v-container fluid class="pa-4 pa-sm-6">
    <div class="d-flex align-center mb-6">
      <v-btn icon="mdi-arrow-left" variant="text" @click="navigateTo('/')" class="mr-2" />
      <v-icon color="primary" class="mr-2">mdi-cog</v-icon>
      <h1 class="text-h6 font-weight-bold">Settings</h1>
    </div>

    <v-row>
      <v-col cols="12" md="8" lg="6">
        <!-- Ollama Configuration -->
        <v-card variant="outlined" class="mb-6">
          <v-card-item>
            <template #prepend>
              <v-icon color="primary">mdi-robot-outline</v-icon>
            </template>
            <v-card-title>Ollama Configuration</v-card-title>
            <v-card-subtitle>Configure your local AI model for library generation</v-card-subtitle>
          </v-card-item>

          <v-card-text class="pt-4">
            <v-form @submit.prevent="save">
              <v-text-field
                v-model="config.url"
                label="Ollama API URL"
                placeholder="http://localhost:11434"
                hint="The base URL where Ollama is running"
                persistent-hint
                class="mb-4"
              >
                <template #append-inner>
                  <v-btn
                    size="small"
                    variant="tonal"
                    color="primary"
                    :loading="loadingModels"
                    @click="fetchModels"
                  >
                    Load Models
                  </v-btn>
                </template>
              </v-text-field>

              <v-select
                v-model="config.model"
                :items="availableModels"
                label="Selected Model"
                placeholder="Select a model"
                :disabled="availableModels.length === 0"
                hint="Choose which model to use for generating summaries"
                persistent-hint
                class="mb-6"
              />

              <div class="d-flex align-center">
                <v-btn
                  color="primary"
                  variant="flat"
                  :loading="saving"
                  @click="save"
                >
                  Save Settings
                </v-btn>
                <v-spacer />
                <v-chip v-if="saved" color="success" size="small" variant="tonal" prepend-icon="mdi-check">
                  Saved
                </v-chip>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="errorShow" color="error" timeout="3000">
      {{ errorMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import type { OllamaSettings } from '#shared/types/notes'

useHead({ title: 'Settings' })

const config = ref<OllamaSettings>({
  url: 'http://localhost:11434',
  model: '',
})

const availableModels = ref<string[]>([])
const loadingModels = ref(false)
const saving = ref(false)
const saved = ref(false)
const errorShow = ref(false)
const errorMessage = ref('')

// Load current settings
const { data: initialSettings } = await useFetch<OllamaSettings>('/api/settings/ollama')
if (initialSettings.value) {
  config.value = { ...initialSettings.value }
  if (config.value.url) {
    fetchModels()
  }
}

async function fetchModels() {
  if (!config.value.url) return
  loadingModels.value = true
  try {
    const models = await $fetch<string[]>('/api/ollama/models')
    availableModels.value = models
    if (models.length > 0 && !config.value.model) {
      config.value.model = models[0]
    }
  } catch (err) {
    errorMessage.value = 'Failed to connect to Ollama'
    errorShow.value = true
  } finally {
    loadingModels.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await $fetch('/api/settings/ollama', {
      method: 'PUT',
      body: config.value,
    })
    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  } catch (err) {
    errorMessage.value = 'Failed to save settings'
    errorShow.value = true
  } finally {
    saving.value = false
  }
}
</script>
