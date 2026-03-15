<script setup lang="ts">
import { ref, watch } from 'vue'
import { useFoods } from '@/composables/useFoods'
import { useRecipes } from '@/composables/useRecipes'
import { useToast } from '@/composables/useToast'
import { db } from '@/db/database'
import FoodCard from '@/components/ui/FoodCard.vue'
import Modal from '@/components/ui/Modal.vue'
import FoodForm from '@/components/ui/FoodForm.vue'
import RecipeForm from '@/components/ui/RecipeForm.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import type { Food, Recipe, RecipeItem, NutritionSummary } from '@/db/types'

const { foods, addFood, updateFood, deleteFood } = useFoods()
const { recipes, addRecipe, updateRecipe, deleteRecipe, getRecipeItems, getRecipeNutrition } = useRecipes()
const toast = useToast()

const activeTab = ref<'foods' | 'recipes'>('foods')
const showFoodModal = ref(false)
const showRecipeModal = ref(false)
const editingFood = ref<Food | undefined>()
const editingRecipe = ref<Recipe | undefined>()
const editingRecipeItems = ref<{ food: Food, quantity: number }[]>([])
const recipeNutritions = ref<Map<number, NutritionSummary>>(new Map())

const showConfirmDelete = ref(false)
const confirmDeleteId = ref<number | null>(null)
const confirmDeleteType = ref<'food' | 'recipe'>('food')

async function handleSaveFood(food: Omit<Food, 'id'>) {
  if (editingFood.value?.id) {
    await updateFood(editingFood.value.id, food)
    toast.success('Food updated!')
  } else {
    await addFood(food)
    toast.success('Food added!')
  }
  showFoodModal.value = false
  editingFood.value = undefined
}

function openEditFood(food: Food) {
  editingFood.value = food
  showFoodModal.value = true
}

function openAddFood() {
  editingFood.value = undefined
  showFoodModal.value = true
}

function handleDeleteFood(id: number) {
  confirmDeleteId.value = id
  confirmDeleteType.value = 'food'
  showConfirmDelete.value = true
}

async function openEditRecipe(recipe: Recipe) {
  const items = await getRecipeItems(recipe.id!)
  const resolved: { food: Food, quantity: number }[] = []
  for (const item of items) {
    const food = await db.foods.get(item.foodId)
    if (food) resolved.push({ food, quantity: item.quantity })
  }
  editingRecipe.value = recipe
  editingRecipeItems.value = resolved
  showRecipeModal.value = true
}

function openAddRecipe() {
  editingRecipe.value = undefined
  editingRecipeItems.value = []
  showRecipeModal.value = true
}

async function handleSaveRecipe(recipe: Omit<Recipe, 'id'>, items: Omit<RecipeItem, 'id' | 'recipeId'>[]) {
  if (editingRecipe.value?.id) {
    await updateRecipe(editingRecipe.value.id, recipe, items)
    recipeNutritions.value.delete(editingRecipe.value.id)
    toast.success('Recipe updated!')
  } else {
    await addRecipe(recipe, items)
    toast.success('Recipe added!')
  }
  showRecipeModal.value = false
  editingRecipe.value = undefined
  editingRecipeItems.value = []
}

function handleDeleteRecipe(id: number) {
  confirmDeleteId.value = id
  confirmDeleteType.value = 'recipe'
  showConfirmDelete.value = true
}

async function confirmDelete() {
  if (confirmDeleteId.value === null) return
  if (confirmDeleteType.value === 'food') {
    await deleteFood(confirmDeleteId.value)
    toast.success('Food deleted')
  } else {
    await deleteRecipe(confirmDeleteId.value)
    recipeNutritions.value.delete(confirmDeleteId.value)
    toast.success('Recipe deleted')
  }
  showConfirmDelete.value = false
  confirmDeleteId.value = null
}

async function loadRecipeNutrition(recipeId: number) {
  if (!recipeNutritions.value.has(recipeId)) {
    const n = await getRecipeNutrition(recipeId)
    recipeNutritions.value.set(recipeId, n)
  }
  return recipeNutritions.value.get(recipeId)!
}

watch(recipes, (list) => {
  if (!list) return
  for (const recipe of list) {
    if (recipe.id) loadRecipeNutrition(recipe.id)
  }
}, { immediate: true })
</script>

<template>
  <div class="p-5 space-y-4">
    <!-- Tabs -->
    <div class="flex bg-bg-card rounded-xl p-1">
      <button
        class="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
        :class="activeTab === 'foods' ? 'bg-bg-elevated shadow-sm text-accent' : 'text-text-muted'"
        @click="activeTab = 'foods'"
      >
        Foods
      </button>
      <button
        class="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
        :class="activeTab === 'recipes' ? 'bg-bg-elevated shadow-sm text-accent' : 'text-text-muted'"
        @click="activeTab = 'recipes'"
      >
        Recipes
      </button>
    </div>

    <!-- Foods Tab -->
    <div v-if="activeTab === 'foods'" class="space-y-3">
      <button
        @click="openAddFood"
        class="w-full py-3 rounded-xl text-sm font-semibold text-white bg-accent active:scale-[0.98] transition-transform"
      >
        + Add Food
      </button>

      <div v-if="!foods?.length" class="text-center py-12">
        <p class="text-text-muted text-sm">No foods yet</p>
        <p class="text-text-muted text-xs mt-1">Add your first food to get started</p>
      </div>

      <div v-else class="space-y-2">
        <div v-for="food in foods" :key="food.id" class="relative">
          <FoodCard :food="food" :clickable="true" @select="openEditFood" />
          <button
            class="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
            @click.stop="handleDeleteFood(food.id!)"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Recipes Tab -->
    <div v-if="activeTab === 'recipes'" class="space-y-3">
      <button
        @click="openAddRecipe"
        class="w-full py-3 rounded-xl text-sm font-semibold text-white bg-accent active:scale-[0.98] transition-transform"
      >
        + Add Recipe
      </button>

      <div v-if="!recipes?.length" class="text-center py-12">
        <p class="text-text-muted text-sm">No recipes yet</p>
        <p class="text-text-muted text-xs mt-1">Recipes combine multiple foods</p>
      </div>

      <div v-else class="space-y-2">
        <div v-for="recipe in recipes" :key="recipe.id" class="flex items-center gap-3 p-3 bg-bg-card rounded-xl active:scale-[0.98] cursor-pointer transition-all duration-150" @click="openEditRecipe(recipe)">
          <div class="flex-1 min-w-0">
            <p class="font-medium text-sm truncate">{{ recipe.name }}</p>
            <p v-if="recipe.category" class="text-xs text-text-muted">{{ recipe.category }}</p>
            <div v-if="recipe.id && recipeNutritions.has(recipe.id)" class="flex items-center gap-3 mt-1.5">
              <span class="text-xs font-semibold text-calories">{{ recipeNutritions.get(recipe.id)!.calories }} kcal</span>
              <span class="text-xs text-protein">P {{ recipeNutritions.get(recipe.id)!.protein }}g</span>
              <span class="text-xs text-carbs">C {{ recipeNutritions.get(recipe.id)!.carbs }}g</span>
              <span class="text-xs text-fat">F {{ recipeNutritions.get(recipe.id)!.fat }}g</span>
            </div>
          </div>
          <button
            class="w-7 h-7 flex items-center justify-center rounded-full text-text-muted hover:text-danger hover:bg-danger/10"
            @click.stop="handleDeleteRecipe(recipe.id!)"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Food Form Modal -->
    <Modal :open="showFoodModal" :title="editingFood ? 'Edit Food' : 'Add Food'" @close="showFoodModal = false">
      <FoodForm :food="editingFood" @save="handleSaveFood" @cancel="showFoodModal = false" />
    </Modal>

    <!-- Recipe Form Modal -->
    <Modal :open="showRecipeModal" :title="editingRecipe ? 'Edit Recipe' : 'Add Recipe'" @close="showRecipeModal = false; editingRecipe = undefined; editingRecipeItems = []">
      <RecipeForm :recipe="editingRecipe" :initial-items="editingRecipeItems" @save="handleSaveRecipe" @cancel="showRecipeModal = false; editingRecipe = undefined; editingRecipeItems = []" />
    </Modal>

    <!-- Delete Confirmation -->
    <ConfirmDialog
      :open="showConfirmDelete"
      title="Delete Confirmation"
      :message="confirmDeleteType === 'food' ? 'Are you sure you want to delete this food?' : 'Are you sure you want to delete this recipe?'"
      @confirm="confirmDelete"
      @cancel="showConfirmDelete = false"
    />
  </div>
</template>
