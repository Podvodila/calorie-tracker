<script setup lang="ts">
import { toRef } from 'vue'
import { useFoodImage } from '@/composables/useFoodImage'
import type { Food } from '@/db/types'

const props = defineProps<{
  food: Food
  clickable?: boolean
}>()

defineEmits<{
  select: [food: Food]
}>()

const { imageSrc } = useFoodImage(toRef(props, 'food'))
</script>

<template>
  <div
    class="flex items-center gap-3 p-3 bg-bg-card rounded-xl transition-all duration-150"
    :class="clickable ? 'active:scale-[0.98] cursor-pointer' : ''"
    @click="clickable && $emit('select', food)"
  >
    <div v-if="imageSrc" class="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-bg-elevated">
      <img :src="imageSrc" alt="" loading="lazy" class="w-full h-full object-cover" />
    </div>
    <div class="flex-1 min-w-0">
      <p class="font-medium text-sm truncate">{{ food.name }}</p>
      <p v-if="food.brand" class="text-xs text-text-muted truncate">{{ food.brand }}</p>
      <div class="flex items-center gap-3 mt-1.5">
        <span class="text-xs font-semibold text-calories">{{ food.calories }} kcal</span>
        <span class="text-xs text-protein">P {{ food.protein }}g</span>
        <span class="text-xs text-carbs">C {{ food.carbs }}g</span>
        <span class="text-xs text-fat">F {{ food.fat }}g</span>
      </div>
    </div>
    <div
      v-if="food.category"
      class="max-w-[120px] truncate px-2 py-0.5 bg-accent/10 text-accent text-[10px] font-medium rounded-full"
    >
      {{ food.category }}
    </div>
  </div>
</template>
