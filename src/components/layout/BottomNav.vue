<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { name: 'dashboard', path: '/', label: 'Home', icon: 'home' },
  { name: 'add-intake', path: '/add-intake', label: 'Add', icon: 'plus' },
  { name: 'foods', path: '/foods', label: 'Foods', icon: 'food' },
  { name: 'history', path: '/history', label: 'History', icon: 'calendar' },
  { name: 'plan', path: '/plan', label: 'Plan', icon: 'settings' },
]

function isActive(name: string) {
  return route.name === name
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-40 bg-bg-elevated/90 backdrop-blur-lg border-t border-border">
    <div class="flex items-center justify-around px-2 py-1.5">
      <router-link
        v-for="tab in tabs"
        :key="tab.name"
        :to="tab.path"
        class="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200"
        :class="isActive(tab.name) ? 'text-accent' : 'text-text-muted'"
      >
        <!-- Home icon -->
        <svg v-if="tab.icon === 'home'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <!-- Plus icon -->
        <svg v-if="tab.icon === 'plus'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <!-- Food icon -->
        <svg v-if="tab.icon === 'food'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h18v18H3zM12 8v8m-4-4h8" />
        </svg>
        <!-- Calendar icon -->
        <svg v-if="tab.icon === 'calendar'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <!-- Settings icon -->
        <svg v-if="tab.icon === 'settings'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span class="text-xs font-medium">{{ tab.label }}</span>
      </router-link>
    </div>
  </nav>
</template>
