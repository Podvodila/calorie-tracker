<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePlan } from '@/composables/usePlan'
import { useIntakeLog } from '@/composables/useIntakeLog'
import { useToast } from '@/composables/useToast'
import NutritionGauge from '@/components/ui/NutritionGauge.vue'
import MealGroup from '@/components/intake/MealGroup.vue'
import Modal from '@/components/ui/Modal.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import type { MealType, IntakeWithFood } from '@/db/types'

const today = () => new Date().toISOString().split('T')[0]
const { plan } = usePlan()
const { dailyTotals, mealGroups, entriesWithFood, updateIntake, deleteIntake } = useIntakeLog(today)
const toast = useToast()

const formattedDate = computed(() => {
  const d = new Date()
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
})

const mealOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']
const mealLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

const showEditModal = ref(false)
const editingEntry = ref<IntakeWithFood | null>(null)
const editQuantity = ref(100)
const editMealType = ref<MealType>('breakfast')
const isSaving = ref(false)

const editEstimatedCalories = computed(() => {
  if (!editingEntry.value) return 0
  const ratio = editQuantity.value / 100
  if (editingEntry.value.food) return Math.round(editingEntry.value.food.calories * ratio)
  if (editingEntry.value.recipeNutrition) return Math.round(editingEntry.value.recipeNutrition.calories * ratio)
  return 0
})

const editFoodName = computed(() => {
  if (!editingEntry.value) return ''
  if (editingEntry.value.food) return editingEntry.value.food.name
  if (editingEntry.value.recipe) return editingEntry.value.recipe.name
  return 'Unknown'
})

const editCalsPer100 = computed(() => {
  if (!editingEntry.value) return 0
  if (editingEntry.value.food) return editingEntry.value.food.calories
  if (editingEntry.value.recipeNutrition) return editingEntry.value.recipeNutrition.calories
  return 0
})

function handleEdit(id: number) {
  const entry = entriesWithFood.value?.find(e => e.id === id)
  if (!entry) return
  editingEntry.value = entry
  editQuantity.value = entry.quantity
  editMealType.value = entry.mealType
  showEditModal.value = true
}

async function handleSaveEdit() {
  if (!editingEntry.value?.id) return
  isSaving.value = true
  try {
    await updateIntake(editingEntry.value.id, {
      quantity: editQuantity.value,
      mealType: editMealType.value,
    })
    showEditModal.value = false
    editingEntry.value = null
    toast.success('Entry updated')
  } finally {
    isSaving.value = false
  }
}

const showConfirmDelete = ref(false)
const confirmDeleteId = ref<number | null>(null)

function handleDelete(id: number) {
  confirmDeleteId.value = id
  showConfirmDelete.value = true
}

async function confirmDelete() {
  if (confirmDeleteId.value === null) return
  isSaving.value = true
  try {
    await deleteIntake(confirmDeleteId.value)
    toast.success('Entry removed')
    showConfirmDelete.value = false
    confirmDeleteId.value = null
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="p-5 space-y-5">
    <div>
      <p class="text-sm text-text-muted">{{ formattedDate }}</p>
      <h2 class="text-2xl font-bold font-display mt-0.5">Today's Nutrition</h2>
    </div>

    <NutritionGauge :nutrition="dailyTotals" :plan="plan" />

    <div class="space-y-4">
      <MealGroup
        v-for="meal in mealOrder"
        :key="meal"
        :meal-type="meal"
        :items="mealGroups[meal]"
        @delete="handleDelete"
        @edit="handleEdit"
      />
    </div>

    <div v-if="!mealGroups.breakfast.length && !mealGroups.lunch.length && !mealGroups.dinner.length && !mealGroups.snack.length" class="text-center py-8">
      <p class="text-text-muted text-sm">No meals logged today</p>
      <p class="text-text-muted text-xs mt-1">Tap the + button to add your first meal</p>
    </div>

    <Modal :open="showEditModal" title="Edit Intake" @close="showEditModal = false">
      <div class="space-y-5">
        <!-- Food name & base info -->
        <div class="bg-bg-card rounded-xl p-4">
          <p class="font-semibold">{{ editFoodName }}</p>
          <p class="text-xs text-text-muted mt-0.5">{{ editCalsPer100 }} kcal per 100g</p>
        </div>

        <!-- Quantity -->
        <div>
          <label class="text-sm font-medium text-text-secondary block mb-2">Quantity (g)</label>
          <div class="flex items-center gap-3">
            <button
              class="w-10 h-10 rounded-xl bg-bg-card flex items-center justify-center text-lg font-bold active:scale-95 transition-transform"
              @click="editQuantity = Math.max(10, editQuantity - 10)"
            >-</button>
            <input
              v-model.number="editQuantity"
              type="number"
              min="1"
              class="flex-1 text-center text-lg font-bold bg-bg-card rounded-xl h-10 border-0 outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              class="w-10 h-10 rounded-xl bg-bg-card flex items-center justify-center text-lg font-bold active:scale-95 transition-transform"
              @click="editQuantity += 10"
            >+</button>
          </div>
          <p class="text-center text-sm text-calories font-semibold mt-2">{{ editEstimatedCalories }} kcal</p>
        </div>

        <!-- Meal type -->
        <div>
          <label class="text-sm font-medium text-text-secondary block mb-2">Meal</label>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="meal in mealOrder"
              :key="meal"
              class="py-2 rounded-xl text-xs font-semibold transition-colors"
              :class="editMealType === meal ? 'bg-accent text-white' : 'bg-bg-card text-text-secondary'"
              @click="editMealType = meal"
            >{{ mealLabels[meal] }}</button>
          </div>
        </div>

        <!-- Save -->
        <div class="sticky bottom-0 bg-bg-elevated pt-3 -mx-5 px-5 -mb-5 pb-5">
          <button
            class="w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-accent active:scale-[0.98] transition-transform disabled:opacity-50"
            :disabled="isSaving"
            @click="handleSaveEdit"
          >{{ isSaving ? 'Saving...' : 'Save Changes' }}</button>
        </div>
      </div>
    </Modal>

    <!-- Delete Confirmation -->
    <ConfirmDialog
      :open="showConfirmDelete"
      :loading="isSaving"
      title="Delete Confirmation"
      message="Are you sure you want to delete this entry?"
      @confirm="confirmDelete"
      @cancel="showConfirmDelete = false"
    />
  </div>
</template>
