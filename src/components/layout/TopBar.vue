<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useOnline } from '@vueuse/core'

const route = useRoute()
const isOnline = useOnline()

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    dashboard: 'Dashboard',
    'add-intake': 'Add Intake',
    foods: 'Foods',
    history: 'History',
    plan: 'Plan',
  }
  return titles[route.name as string] || 'Calorie Tracker'
})
</script>

<template>
  <header class="sticky top-0 z-30 bg-bg-primary/80 backdrop-blur-lg border-b border-border-light">
    <div class="flex items-center justify-between px-5 py-3">
      <h1 class="text-xl font-bold font-display">{{ pageTitle }}</h1>
      <div
        v-if="!isOnline"
        class="flex items-center gap-1.5 text-xs text-text-muted bg-bg-card px-2.5 py-1 rounded-full"
      >
        <span class="w-2 h-2 bg-warning rounded-full"></span>
        Offline
      </div>
    </div>
  </header>
</template>
