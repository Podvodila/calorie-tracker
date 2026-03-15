<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts } = useToast()

const typeStyles: Record<string, string> = {
  success: 'bg-success text-white',
  error: 'bg-danger text-white',
  info: 'bg-accent text-white',
}
</script>

<template>
  <div class="fixed top-14 left-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
    <transition-group name="fade">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="px-4 py-3 rounded-xl text-sm font-medium shadow-lg pointer-events-auto"
        :class="typeStyles[toast.type]"
      >
        {{ toast.message }}
      </div>
    </transition-group>
  </div>
</template>
