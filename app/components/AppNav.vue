<template>
  <v-app-bar color="surface" elevation="1">
    <v-app-bar-title>
      <NuxtLink to="/" class="text-decoration-none">
        <span class="text-primary font-weight-bold">quick</span><span class="text-white font-weight-bold">Note</span>
      </NuxtLink>
    </v-app-bar-title>

    <template #append>
      <v-btn
        :to="`/note/${today}`"
        :active="isToday"
        prepend-icon="mdi-calendar-today"
        variant="text"
        size="small"
        class="mr-1"
      >
        Today
      </v-btn>

      <v-btn
        to="/pages"
        :active="isPages"
        prepend-icon="mdi-file-document-multiple"
        variant="text"
        size="small"
      >
        Pages
      </v-btn>

      <v-btn
        to="/graph"
        :active="isGraph"
        prepend-icon="mdi-graph"
        variant="text"
        size="small"
      >
        Graph
      </v-btn>

      <v-btn
        to="/canvas"
        :active="isCanvas"
        prepend-icon="mdi-view-dashboard-outline"
        variant="text"
        size="small"
        class="mr-2"
      >
        Canvas
      </v-btn>

      <v-divider vertical class="mx-2" style="height: 24px; align-self: center" />

      <v-menu>
        <template #activator="{ props: menuProps }">
          <v-btn
            v-bind="menuProps"
            :prepend-icon="'mdi-account-circle'"
            variant="text"
            size="small"
          >
            {{ username }}
          </v-btn>
        </template>
        <v-list>
          <v-list-item prepend-icon="mdi-logout" @click="logout">
            <v-list-item-title>Sign out</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>
  </v-app-bar>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { user, clear } = useUserSession()

const today = computed(() => new Date().toISOString().split('T')[0])
const isToday = computed(() => route.path === `/note/${today.value}`)
const isPages = computed(() => route.path === '/pages' || route.path.startsWith('/page/'))
const isGraph = computed(() => route.path === '/graph')
const isCanvas = computed(() => route.path === '/canvas')
const username = computed(() => (user.value as { username?: string } | null)?.username ?? '')

async function logout() {
  await clear()
  await router.push('/login')
}
</script>
