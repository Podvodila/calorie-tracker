<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  current: number
  target: number
  color: string
  label: string
  unit?: string
}>()

const percentage = computed(() => {
  if (props.target <= 0) return 0
  return Math.min(Math.round((props.current / props.target) * 100), 100)
})
</script>

<template>
  <div class="space-y-1">
    <div class="flex items-center justify-between text-sm">
      <span class="font-medium text-text-secondary">{{ label }}</span>
      <span class="text-text-muted text-xs">
        {{ current }}{{ unit || '' }} / {{ target }}{{ unit || '' }}
      </span>
    </div>
    <div class="h-2.5 bg-border-light rounded-full overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-500 ease-out"
        :style="{ width: percentage + '%', backgroundColor: color }"
      />
    </div>
  </div>
</template>
