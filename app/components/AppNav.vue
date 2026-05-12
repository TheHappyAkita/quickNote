<template>
  <v-app-bar color="surface" elevation="1">
    <v-app-bar-title>
      <NuxtLink to="/" class="text-decoration-none">
        <span class="text-primary font-weight-bold">quick</span><span class="text-white font-weight-bold">Note</span>
      </NuxtLink>
    </v-app-bar-title>

    <template #append>
      <!-- Today — always visible -->
      <v-btn
        :to="`/note/${today}`"
        :active="isActive('today')"
        prepend-icon="mdi-calendar-today"
        variant="text"
        size="small"
        class="mr-1"
      >
        Today
      </v-btn>

      <!-- Favorite nav items -->
      <template v-for="item in favoriteItems" :key="item.id">
        <v-btn
          :to="item.to"
          :active="isActive(item.id)"
          :prepend-icon="item.icon"
          variant="text"
          size="small"
        >
          {{ item.label }}
        </v-btn>
      </template>

      <!-- All pages dropdown -->
      <v-menu :close-on-content-click="false">
        <template #activator="{ props: menuProps }">
          <v-btn
            v-bind="menuProps"
            icon="mdi-dots-grid"
            variant="text"
            size="small"
            title="All pages"
            class="mx-1"
          />
        </template>
        <v-list density="compact" min-width="220">
          <v-list-subheader>Navigation</v-list-subheader>
          <v-list-item
            v-for="item in allNavItems"
            :key="item.id"
            :to="item.to"
            :active="isActive(item.id)"
            active-color="primary"
            :prepend-icon="item.icon"
            rounded="lg"
          >
            <v-list-item-title>{{ item.label }}</v-list-item-title>
            <template #append>
              <v-btn
                :icon="favorites.has(item.id) ? 'mdi-star' : 'mdi-star-outline'"
                :color="favorites.has(item.id) ? 'amber' : 'grey'"
                variant="text"
                size="x-small"
                :title="favorites.has(item.id) ? 'Remove from bar' : 'Pin to bar'"
                @click.prevent.stop="toggleFavorite(item.id)"
              />
            </template>
          </v-list-item>
          <v-divider class="my-1" />
          <v-list-item
            :to="`/help`"
            :active="isActive('help')"
            prepend-icon="mdi-help-circle-outline"
            rounded="lg"
          >
            <v-list-item-title>Help</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- Theme toggle -->
      <v-menu :close-on-content-click="true">
        <template #activator="{ props: menuProps }">
          <v-btn
            v-bind="menuProps"
            :icon="currentThemeIcon"
            variant="text"
            size="small"
            title="Switch theme"
          />
        </template>
        <v-list density="compact" min-width="160">
          <v-list-subheader>Theme</v-list-subheader>
          <v-list-item
            v-for="t in themes"
            :key="t.id"
            :prepend-icon="t.icon"
            :active="currentTheme === t.id"
            active-color="primary"
            rounded="lg"
            @click="applyTheme(t.id)"
          >
            <v-list-item-title>{{ t.label }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-divider vertical class="mx-2" style="height: 24px; align-self: center" />

      <v-menu>
        <template #activator="{ props: menuProps }">
          <v-btn
            v-bind="menuProps"
            prepend-icon="mdi-account-circle"
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
const username = computed(() => (user.value as { username?: string } | null)?.username ?? '')

interface NavItem {
  id: string
  label: string
  icon: string
  to: string
  activeTest: () => boolean
}

const allNavItems: NavItem[] = [
  { id: 'pages',     label: 'Pages',     icon: 'mdi-file-document-multiple',  to: '/pages',     activeTest: () => route.path === '/pages' || route.path.startsWith('/page/') },
  { id: 'persons',   label: 'People',    icon: 'mdi-account-group',            to: '/persons',   activeTest: () => route.path === '/persons' || route.path.startsWith('/person/') },
  { id: 'locations', label: 'Locations', icon: 'mdi-map-marker-multiple',      to: '/locations', activeTest: () => route.path === '/locations' || route.path.startsWith('/location/') },
  { id: 'map',       label: 'Map',       icon: 'mdi-map',                      to: '/map',       activeTest: () => route.path === '/map' },
  { id: 'graph',     label: 'Graph',     icon: 'mdi-graph',                    to: '/graph',     activeTest: () => route.path === '/graph' },
  { id: 'canvas',    label: 'Canvas',    icon: 'mdi-view-dashboard-outline',   to: '/canvas',    activeTest: () => route.path === '/canvas' },
]

function isActive(id: string): boolean {
  if (id === 'today') return route.path === `/note/${today.value}`
  if (id === 'help')  return route.path === '/help'
  return allNavItems.find(n => n.id === id)?.activeTest() ?? false
}

// ── Favorites (persisted in localStorage) ────────────────────────────────────
const STORAGE_KEY = 'quicknote:nav:favorites'
const DEFAULT_FAVORITES = ['pages', 'graph']

const favorites = ref<Set<string>>(new Set(DEFAULT_FAVORITES))

onMounted(() => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) favorites.value = new Set(JSON.parse(stored) as string[])
  } catch {}
})

function toggleFavorite(id: string) {
  const next = new Set(favorites.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  favorites.value = next
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])) } catch {}
}

const favoriteItems = computed(() =>
  allNavItems.filter(item => favorites.value.has(item.id)),
)

// ── Theme ────────────────────────────────────────────────────────────────────
const { current: currentTheme, themes, apply: applyTheme } = useAppTheme()
const currentThemeIcon = computed(() => themes.find(t => t.id === currentTheme.value)?.icon ?? 'mdi-weather-night')

async function logout() {
  await clear()
  await router.push('/login')
}
</script>
