<!-- Copyright (C) 2026 TheHappyAkita - SPDX-License-Identifier: GPL-3.0-only -->
<script setup lang="ts">
const today = new Date().toISOString().split('T')[0]
await navigateTo(`/note/${today}`, { replace: true })
</script>
