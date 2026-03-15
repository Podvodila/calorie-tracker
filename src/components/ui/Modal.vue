<script setup lang="ts">
const props = defineProps<{
  open: boolean
  title: string
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        @click.self="emit('close')"
      />
    </transition>
    <transition name="slide-up">
      <div
        v-if="open"
        class="fixed bottom-0 left-0 right-0 z-50 bg-bg-elevated rounded-t-3xl max-h-[85vh] flex flex-col"
      >
        <div class="flex items-center justify-between p-5 pb-3 border-b border-border-light">
          <h2 class="text-lg font-bold font-display">{{ title }}</h2>
          <button
            class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg-card transition-colors"
            @click="emit('close')"
          >
            <svg class="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-5">
          <slot />
        </div>
      </div>
    </transition>
  </Teleport>
</template>
