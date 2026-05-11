<template>
  <div class="persons-scroll">
    <v-container class="py-6" style="max-width: 720px">
      <div class="d-flex align-center mb-5">
        <v-icon color="pink" class="mr-2" size="24">mdi-account-group</v-icon>
        <h1 class="text-h6 font-weight-bold">People</h1>
        <v-spacer />
        <span class="text-caption text-medium-emphasis">{{ persons.length }} entr{{ persons.length === 1 ? 'y' : 'ies' }}</span>
      </div>

      <div v-if="pending" class="d-flex justify-center pa-8">
        <v-progress-circular indeterminate color="pink" />
      </div>

      <div v-else-if="persons.length === 0" class="text-center text-medium-emphasis pa-8">
        <v-icon size="48" color="pink" class="mb-3">mdi-account-off-outline</v-icon>
        <div>No person pages yet.</div>
        <div class="text-caption mt-1">Use <code>@[[Lastname, Forename]]</code> in notes — then click the link to create a page.</div>
      </div>

      <v-list v-else lines="one">
        <v-list-item
          v-for="name in persons"
          :key="name"
          :to="`/person/${encodeURIComponent(name)}`"
          rounded="lg"
          class="mb-1"
        >
          <template #prepend>
            <v-icon color="pink" size="20">mdi-account</v-icon>
          </template>
          <v-list-item-title>{{ name }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-container>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'People — quickNote' })

const { data: persons, pending } = await useFetch<string[]>('/api/persons', {
  server: false,
  default: () => [],
})
</script>

<style scoped>
.persons-scroll {
  height: 100%;
  overflow-y: auto;
}
code {
  background: rgba(108, 99, 255, 0.12);
  color: #b8a5ff;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 0.82rem;
}
</style>
