<script setup lang="ts">
import type { IntakeWithFood, MealType } from '@/db/types'
import IntakeItem from './IntakeItem.vue'

defineProps<{
  mealType: MealType
  items: IntakeWithFood[]
}>()

defineEmits<{
  delete: [id: number]
  edit: [id: number]
}>()

const mealLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

const mealIcons: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍿',
}
</script>

<template>
  <div v-if="items.length > 0" class="space-y-2">
    <h3 class="text-sm font-semibold text-text-secondary flex items-center gap-2 px-1">
      <span>{{ mealIcons[mealType] }}</span>
      {{ mealLabels[mealType] }}
    </h3>
    <div class="space-y-1.5">
      <IntakeItem
        v-for="item in items"
        :key="item.id"
        :entry="item"
        @delete="$emit('delete', item.id!)"
        @edit="$emit('edit', item.id!)"
      />
    </div>
  </div>
</template>
