<script setup lang="ts">
defineProps<{
  categories: string[]
  selected: string | null
}>()

defineEmits<{
  select: [category: string | null]
}>()
</script>

<template>
  <div class="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
    <button
      class="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all"
      :class="!selected ? 'bg-accent text-white' : 'bg-bg-card text-text-secondary'"
      @click="$emit('select', null)"
    >
      All
    </button>
    <button
      v-for="cat in categories"
      :key="cat"
      class="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all"
      :class="selected === cat ? 'bg-accent text-white' : 'bg-bg-card text-text-secondary'"
      @click="$emit('select', cat)"
    >
      {{ cat }}
    </button>
  </div>
</template>
