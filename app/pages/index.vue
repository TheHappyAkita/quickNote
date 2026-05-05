<script setup lang="ts">
const today = new Date().toISOString().split('T')[0]
await navigateTo(`/note/${today}`, { replace: true })
</script>
