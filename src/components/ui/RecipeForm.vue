<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFoodSearch } from '@/composables/useFoodSearch'
import SearchInput from '@/components/ui/SearchInput.vue'
import CategoryFilter from '@/components/ui/CategoryFilter.vue'
import FoodCard from '@/components/ui/FoodCard.vue'
import type { Food, Recipe, RecipeItem } from '@/db/types'

export interface SelectedItem {
  food: Food
  quantity: number
}

const props = defineProps<{
  recipe?: Recipe
  initialItems?: SelectedItem[]
}>()

const emit = defineEmits<{
  save: [recipe: Omit<Recipe, 'id'>, items: Omit<RecipeItem, 'id' | 'recipeId'>[]]
  cancel: []
}>()

const name = ref(props.recipe?.name ?? '')
const category = ref(props.recipe?.category ?? '')

const selectedItems = ref<SelectedItem[]>(props.initialItems ? [...props.initialItems] : [])
const showFoodSearch = ref(false)
const { query: searchQuery, results: searchResults, selectedCategory, categories, isSearching } = useFoodSearch()

function addFood(food: Food) {
  if (!food.id) return
  if (selectedItems.value.some(i => i.food.id === food.id)) return
  selectedItems.value.push({ food, quantity: 100 })
  showFoodSearch.value = false
  searchQuery.value = ''
}

function removeFood(index: number) {
  selectedItems.value.splice(index, 1)
}

const totals = computed(() => {
  const result = { calories: 0, protein: 0, carbs: 0, fat: 0 }
  for (const item of selectedItems.value) {
    const ratio = item.quantity / 100
    result.calories += item.food.calories * ratio
    result.protein += item.food.protein * ratio
    result.carbs += item.food.carbs * ratio
    result.fat += item.food.fat * ratio
  }
  return {
    calories: Math.round(result.calories),
    protein: Math.round(result.protein),
    carbs: Math.round(result.carbs),
    fat: Math.round(result.fat),
  }
})

function submit() {
  if (!name.value.trim() || selectedItems.value.length === 0) return
  const recipe: Omit<Recipe, 'id'> = {
    name: name.value.trim(),
    category: category.value.trim() || undefined,
  }
  const items: Omit<RecipeItem, 'id' | 'recipeId'>[] = selectedItems.value.map(i => ({
    foodId: i.food.id!,
    quantity: i.quantity,
  }))
  emit('save', recipe, items)
}
</script>

<template>
  <form @submit.prevent="submit" class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-text-secondary mb-1">Name *</label>
      <input v-model="name" type="text" required class="w-full px-3 py-2.5 bg-bg-card border border-border-light rounded-xl text-sm focus:outline-none focus:border-accent" />
    </div>

    <div>
      <label class="block text-sm font-medium text-text-secondary mb-1">Category</label>
      <input v-model="category" type="text" class="w-full px-3 py-2.5 bg-bg-card border border-border-light rounded-xl text-sm focus:outline-none focus:border-accent" />
    </div>

    <!-- Foods in recipe -->
    <div>
      <label class="block text-sm font-medium text-text-secondary mb-2">Foods *</label>

      <div v-if="selectedItems.length > 0" class="space-y-2 mb-3">
        <div v-for="(item, index) in selectedItems" :key="item.food.id" class="flex items-center gap-2 p-2.5 bg-bg-card rounded-xl">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ item.food.name }}</p>
            <p class="text-[11px] text-text-muted">{{ item.food.calories }} kcal/100{{ item.food.unit || 'g' }}</p>
          </div>
          <div class="flex items-center gap-1.5">
            <button type="button" class="w-7 h-7 flex items-center justify-center rounded-lg bg-bg-elevated text-sm font-bold" @click="item.quantity = Math.max(10, item.quantity - 10)">-</button>
            <input v-model.number="item.quantity" type="number" min="1" class="w-14 text-center py-1 bg-bg-elevated border border-border-light rounded-lg text-sm focus:outline-none focus:border-accent" />
            <button type="button" class="w-7 h-7 flex items-center justify-center rounded-lg bg-bg-elevated text-sm font-bold" @click="item.quantity += 10">+</button>
            <span class="text-[11px] text-text-muted">g</span>
          </div>
          <button type="button" class="w-7 h-7 flex items-center justify-center rounded-full text-text-muted hover:text-danger" @click="removeFood(index)">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Add food search -->
      <div v-if="showFoodSearch" class="space-y-2 mb-3">
        <SearchInput v-model="searchQuery" placeholder="Search food to add..." />
        <CategoryFilter v-if="categories.length > 0" :categories="categories" :selected="selectedCategory" @select="selectedCategory = $event" />
        <div v-if="isSearching" class="text-center py-3">
          <p class="text-text-muted text-xs">Searching...</p>
        </div>
        <div v-else class="max-h-60 overflow-y-auto space-y-1">
          <FoodCard
            v-for="food in searchResults"
            :key="food.id || food.name"
            :food="food"
            :clickable="true"
            @select="addFood"
          />
        </div>
        <button type="button" class="text-xs text-text-muted" @click="showFoodSearch = false; searchQuery = ''">Cancel search</button>
      </div>

      <button
        v-if="!showFoodSearch"
        type="button"
        class="w-full py-2.5 rounded-xl text-xs font-medium text-accent border border-accent/30 bg-accent/5"
        @click="showFoodSearch = true"
      >
        + Add Food
      </button>
    </div>

    <!-- Nutrition totals -->
    <div v-if="selectedItems.length > 0" class="p-3 bg-bg-card rounded-xl">
      <p class="text-xs text-text-muted font-medium mb-1.5">Recipe totals</p>
      <div class="flex items-center gap-3">
        <span class="text-xs font-semibold text-calories">{{ totals.calories }} kcal</span>
        <span class="text-xs text-protein">P {{ totals.protein }}g</span>
        <span class="text-xs text-carbs">C {{ totals.carbs }}g</span>
        <span class="text-xs text-fat">F {{ totals.fat }}g</span>
      </div>
    </div>

    <div class="flex gap-3 pt-2">
      <button type="button" class="flex-1 py-3 rounded-xl text-sm font-medium text-text-secondary bg-bg-card" @click="emit('cancel')">
        Cancel
      </button>
      <button type="submit" class="flex-1 py-3 rounded-xl text-sm font-medium text-white bg-accent active:scale-[0.98] transition-transform">
        {{ recipe ? 'Update Recipe' : 'Save Recipe' }}
      </button>
    </div>
  </form>
</template>
