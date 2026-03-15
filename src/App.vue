<script setup lang="ts">
import { useRoute } from 'vue-router'
import TopBar from '@/components/layout/TopBar.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'

const route = useRoute()
</script>

<template>
  <div class="flex flex-col h-full bg-bg-primary">
    <TopBar />
    <main class="flex-1 overflow-y-auto pb-20">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <!-- FAB — outside router-view transition to prevent flicker -->
    <router-link
      v-if="route.name === 'dashboard'"
      to="/add-intake"
      class="fixed right-5 bottom-24 w-14 h-14 bg-accent rounded-full flex items-center justify-center shadow-lg shadow-accent/25 active:scale-95 transition-transform z-30"
    >
      <svg class="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    </router-link>
    <BottomNav />
    <ToastContainer />
  </div>
</template>
