<script setup lang="ts">
import type { NutritionSummary, Plan } from '@/db/types'
import ProgressBar from './ProgressBar.vue'

defineProps<{
  nutrition: NutritionSummary
  plan: Plan
}>()
</script>

<template>
  <div class="space-y-3 p-4 bg-bg-card rounded-2xl">
    <ProgressBar
      :current="nutrition.calories"
      :target="plan.dailyCalories"
      color="#E8613A"
      label="Calories"
      unit="kcal"
    />
    <ProgressBar
      :current="nutrition.protein"
      :target="plan.dailyProtein"
      color="#42A5F5"
      label="Protein"
      unit="g"
    />
    <ProgressBar
      :current="nutrition.carbs"
      :target="plan.dailyCarbs"
      color="#F87171"
      label="Carbs"
      unit="g"
    />
    <ProgressBar
      :current="nutrition.fat"
      :target="plan.dailyFat"
      color="#F5B731"
      label="Fat"
      unit="g"
    />
  </div>
</template>
