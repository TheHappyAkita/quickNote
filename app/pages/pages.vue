<template>
  <v-container fluid class="pa-4 pa-sm-6">
    <div class="d-flex align-center mb-4">
      <v-icon color="secondary" class="mr-2">mdi-file-document-multiple</v-icon>
      <h1 class="text-h6 font-weight-bold">Pages</h1>
      <v-spacer />
      <v-chip size="small" variant="tonal" color="secondary">
        {{ pages?.length ?? 0 }} pages
      </v-chip>
    </div>

    <!-- Create new page -->
    <v-card class="mb-4" variant="outlined">
      <v-card-text class="pa-3">
        <v-form @submit.prevent="createPage">
          <v-text-field
            v-model="newPageName"
            label="New page name"
            placeholder="e.g., Project Ideas, Meeting Notes, Book List"
            variant="outlined"
            density="compact"
            hide-details
            class="mb-2"
            :rules="[nameRules.valid]"
            @keyup.enter="createPage"
          >
            <template #append>
              <v-btn
                color="primary"
                variant="flat"
                size="small"
                :disabled="!isValidName"
                :loading="creating"
                @click="createPage"
              >
                Create
              </v-btn>
            </template>
          </v-text-field>
          <div class="text-caption text-medium-emphasis">
            Use letters, numbers, spaces, hyphens, and underscores
          </div>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Pages list -->
    <v-progress-circular v-if="pending" indeterminate color="secondary" class="d-flex mx-auto" />

    <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
      Failed to load pages
    </v-alert>

    <v-alert v-else-if="!pages?.length" type="info" variant="tonal">
      No pages yet. Create your first page above!
    </v-alert>

    <v-row v-else dense>
      <v-col
        v-for="page in sortedPages"
        :key="page"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card
          variant="outlined"
          class="page-card"
          hover
          :to="`/page/${encodeURIComponent(page)}`"
        >
          <v-card-item>
            <template #prepend>
              <v-icon color="secondary">mdi-file-document-outline</v-icon>
            </template>
            <v-card-title class="text-body-1 text-truncate">
              {{ page }}
            </v-card-title>
          </v-card-item>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
useHead({
  title: 'Pages',
})

const { data: pages, pending, error, refresh } = await useFetch<string[]>('/api/pages', {
  server: false,
  default: () => [],
})

const newPageName = ref('')
const creating = ref(false)

const sortedPages = computed(() => {
  return [...(pages.value ?? [])].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
})

const nameRules = {
  valid: (v: string) => {
    if (!v) return 'Name is required'
    if (!/^[a-zA-Z0-9_\- ]+$/.test(v)) return 'Invalid characters'
    if (v.length > 100) return 'Too long (max 100)'
    return true
  },
}

const isValidName = computed(() => {
  const v = newPageName.value.trim()
  return v && /^[a-zA-Z0-9_\- ]+$/.test(v) && v.length <= 100
})

async function createPage() {
  const name = newPageName.value.trim()
  if (!isValidName.value) return

  creating.value = true
  try {
    await $fetch(`/api/pages/${name}`, {
      method: 'POST',
      body: { content: '' },
    })
    newPageName.value = ''
    await refresh()
    await navigateTo(`/page/${encodeURIComponent(name)}`)
  } catch (err) {
    console.error('Failed to create page:', err)
  } finally {
    creating.value = false
  }
}
</script>

<style scoped>
.page-card {
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s;
}

.page-card:hover {
  transform: translateY(-2px);
  border-color: #6c63ff;
}
</style>
