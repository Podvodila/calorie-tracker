<script setup lang="ts">
const props = defineProps<{
  open: boolean
  title: string
  message: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        @click.self="emit('cancel')"
      />
    </transition>
    <transition name="slide-up">
      <div
        v-if="open"
        class="fixed bottom-0 left-0 right-0 z-50 bg-bg-elevated rounded-t-3xl"
      >
        <div class="p-5 space-y-4">
          <h2 class="text-lg font-bold font-display">{{ title }}</h2>
          <p class="text-sm text-text-secondary">{{ message }}</p>
          <div class="flex gap-3">
            <button
              class="flex-1 py-3 rounded-xl text-sm font-semibold bg-bg-card text-text-secondary active:scale-[0.98] transition-transform"
              @click="emit('cancel')"
            >Cancel</button>
            <button
              class="flex-1 py-3 rounded-xl text-sm font-semibold bg-danger text-white active:scale-[0.98] transition-transform"
              @click="emit('confirm')"
            >Delete</button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>
