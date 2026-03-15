<script setup lang="ts">
import { computed, type Ref } from 'vue'
import { useFoodImage } from '@/composables/useFoodImage'
import type { IntakeWithFood, Food } from '@/db/types'

const props = defineProps<{
  entry: IntakeWithFood
}>()

defineEmits<{
  delete: []
  edit: []
}>()

const foodRef = computed(() => props.entry.food) as Ref<Food>
const { imageSrc } = useFoodImage(foodRef)

const name = computed(() => {
  if (props.entry.food) return props.entry.food.name
  if (props.entry.recipe) return props.entry.recipe.name
  return 'Unknown'
})

const ratio = computed(() => props.entry.quantity / 100)

const calories = computed(() => {
  if (props.entry.food) return Math.round(props.entry.food.calories * ratio.value)
  if (props.entry.recipeNutrition) return Math.round(props.entry.recipeNutrition.calories * ratio.value)
  return 0
})

const protein = computed(() => {
  if (props.entry.food) return Math.round(props.entry.food.protein * ratio.value)
  if (props.entry.recipeNutrition) return Math.round(props.entry.recipeNutrition.protein * ratio.value)
  return 0
})

const carbs = computed(() => {
  if (props.entry.food) return Math.round(props.entry.food.carbs * ratio.value)
  if (props.entry.recipeNutrition) return Math.round(props.entry.recipeNutrition.carbs * ratio.value)
  return 0
})

const fat = computed(() => {
  if (props.entry.food) return Math.round(props.entry.food.fat * ratio.value)
  if (props.entry.recipeNutrition) return Math.round(props.entry.recipeNutrition.fat * ratio.value)
  return 0
})
</script>

<template>
  <div class="flex items-center gap-3 p-3 bg-bg-card rounded-xl group">
    <div v-if="imageSrc" class="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-bg-elevated">
      <img :src="imageSrc" alt="" loading="lazy" class="w-full h-full object-cover" />
    </div>
    <div class="flex-1 min-w-0 cursor-pointer" @click="$emit('edit')">
      <p class="text-sm font-medium truncate">{{ name }}</p>
      <div class="flex items-center gap-3 mt-1">
        <span class="text-xs text-text-muted">{{ entry.quantity }}g</span>
        <span class="text-xs font-semibold text-calories">{{ calories }} kcal</span>
        <span class="text-xs text-protein">P {{ protein }}g</span>
        <span class="text-xs text-carbs">C {{ carbs }}g</span>
        <span class="text-xs text-fat">F {{ fat }}g</span>
      </div>
    </div>
    <button
      class="w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
      @click="$emit('delete')"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  </div>
</template>
