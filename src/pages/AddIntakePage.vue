<script setup lang="ts">
import { ref, computed, nextTick, toRef, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFoodSearch } from '@/composables/useFoodSearch'
import { useIntakeLog } from '@/composables/useIntakeLog'
import { useOpenFoodFacts } from '@/composables/useOpenFoodFacts'
import { useFoodImage } from '@/composables/useFoodImage'
import { useUserCategories } from '@/composables/useUserCategories'
import { useToast } from '@/composables/useToast'
import { db } from '@/db/database'
import SearchInput from '@/components/ui/SearchInput.vue'
import CategoryFilter from '@/components/ui/CategoryFilter.vue'
import FoodCard from '@/components/ui/FoodCard.vue'
import Modal from '@/components/ui/Modal.vue'
import type { Food, MealType } from '@/db/types'

const router = useRouter()
const { query, results, selectedCategory, categories, isSearching } = useFoodSearch()
const { categories: userCategories, addCategory, removeCategory, countFoodsByCategory } = useUserCategories()
const today = () => new Date().toISOString().split('T')[0]
const { addIntake } = useIntakeLog(today)
const { importFood } = useOpenFoodFacts()
const toast = useToast()

const selectedFood = ref<Food | null>(null)
const { imageSrc: selectedFoodImage } = useFoodImage(selectedFood as Ref<Food>)
const showIntakeModal = ref(false)
const intakeQuantity = ref(100)
const intakeMealType = ref<MealType>('lunch')
const selectedFoodCategory = ref<string | null>(null)
const newCategoryInput = ref('')
const showNewCategoryInput = ref(false)
const categoryToDelete = ref<string | null>(null)
const categoryDeleteFoodCount = ref(0)

const mealTypes: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
]

function selectFood(food: Food) {
  selectedFood.value = food
  intakeQuantity.value = 100
  selectedFoodCategory.value = food.category || null
  showNewCategoryInput.value = false
  newCategoryInput.value = ''
  showIntakeModal.value = true
}

async function assignCategory(cat: string | null) {
  selectedFoodCategory.value = cat
  if (selectedFood.value?.id) {
    await db.foods.update(selectedFood.value.id, { category: cat || undefined })
    selectedFood.value = { ...selectedFood.value, category: cat || undefined }
  }
}

async function confirmDeleteCategory(cat: string) {
  categoryDeleteFoodCount.value = await countFoodsByCategory(cat)
  categoryToDelete.value = cat
}

async function executeDeleteCategory() {
  if (!categoryToDelete.value) return
  const wasSelected = selectedFoodCategory.value === categoryToDelete.value
  await removeCategory(categoryToDelete.value)
  if (wasSelected) {
    selectedFoodCategory.value = null
    if (selectedFood.value) {
      selectedFood.value = { ...selectedFood.value, category: undefined }
    }
  }
  categoryToDelete.value = null
}

async function addNewCategory() {
  const name = newCategoryInput.value.trim()
  if (!name) return
  await addCategory(name)
  await assignCategory(name)
  newCategoryInput.value = ''
  showNewCategoryInput.value = false
}

async function saveIntake() {
  if (!selectedFood.value) return

  let foodId = selectedFood.value.id
  if (!foodId) {
    foodId = await importFood(selectedFood.value)
  }

  await addIntake({
    foodId,
    date: today(),
    quantity: intakeQuantity.value,
    mealType: intakeMealType.value,
  })

  showIntakeModal.value = false
  selectedFood.value = null
  await nextTick()
  toast.success('Intake added!')
  router.push('/')
}

const estimatedCalories = computed(() => {
  if (!selectedFood.value) return 0
  return Math.round(selectedFood.value.calories * intakeQuantity.value / 100)
})
</script>

<template>
  <div class="p-5 space-y-4">
    <SearchInput v-model="query" placeholder="Search foods..." />

    <CategoryFilter
      v-if="categories.length > 0"
      :categories="categories"
      :selected="selectedCategory"
      @select="selectedCategory = $event"
    />

    <div v-if="isSearching" class="text-center py-8">
      <p class="text-text-muted text-sm">Searching...</p>
    </div>

    <div v-else-if="(results ?? []).length === 0" class="text-center py-12">
      <p class="text-text-muted text-sm">
        {{ query ? 'No results found' : 'Start typing to search foods' }}
      </p>
    </div>

    <div v-else class="space-y-2">
      <FoodCard
        v-for="food in results"
        :key="food.id || food.name"
        :food="food"
        :clickable="true"
        @select="selectFood"
      />
    </div>

    <!-- Intake Modal -->
    <Modal :open="showIntakeModal" title="Add Intake" @close="showIntakeModal = false">
      <div v-if="selectedFood" class="space-y-5">
        <div class="flex gap-3 p-3 bg-bg-card rounded-xl">
          <img
            v-if="selectedFoodImage"
            :src="selectedFoodImage"
            alt=""
            loading="lazy"
            class="w-20 h-20 rounded-lg object-cover flex-shrink-0"
          />
          <div class="flex-1 min-w-0 flex flex-col justify-center">
            <p class="font-medium text-sm">{{ selectedFood.name }}</p>
            <p v-if="selectedFood.brand" class="text-xs text-text-muted truncate">{{ selectedFood.brand }}</p>
            <p class="text-xs text-text-muted mt-0.5">{{ selectedFood.calories }} kcal per 100{{ selectedFood.unit || 'g' }}</p>
          </div>
        </div>

        <!-- Category selector -->
        <div>
          <label class="block text-sm font-medium text-text-secondary mb-2">Category</label>
          <div class="flex flex-wrap gap-2">
            <button
              class="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              :class="!selectedFoodCategory ? 'bg-accent text-white' : 'bg-bg-card text-text-secondary'"
              @click="assignCategory(null)"
            >
              None
            </button>
            <span
              v-for="cat in userCategories"
              :key="cat"
              class="inline-flex items-center rounded-full text-xs font-medium transition-all"
              :class="selectedFoodCategory === cat ? 'bg-accent text-white' : 'bg-bg-card text-text-secondary'"
            >
              <button
                class="pl-3 py-1.5 pr-1"
                @click="assignCategory(cat)"
              >
                {{ cat }}
              </button>
              <button
                class="pr-2 py-1.5 pl-0.5 opacity-60 hover:opacity-100"
                @click.stop="confirmDeleteCategory(cat)"
              >
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
            <button
              v-if="!showNewCategoryInput"
              class="px-3 py-1.5 rounded-full text-xs font-medium bg-bg-card text-accent"
              @click="showNewCategoryInput = true"
            >
              +
            </button>
          </div>
          <!-- Delete confirmation -->
          <div v-if="categoryToDelete" class="mt-2 p-3 bg-danger/10 border border-danger/20 rounded-xl">
            <p class="text-xs text-text-primary">
              Remove <strong>"{{ categoryToDelete }}"</strong>?
              <span v-if="categoryDeleteFoodCount > 0">
                This will unassign it from {{ categoryDeleteFoodCount }} food{{ categoryDeleteFoodCount !== 1 ? 's' : '' }} currently using it.
              </span>
            </p>
            <div class="flex gap-2 mt-2">
              <button
                class="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-danger"
                @click="executeDeleteCategory"
              >
                Remove
              </button>
              <button
                class="px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary bg-bg-card"
                @click="categoryToDelete = null"
              >
                Cancel
              </button>
            </div>
          </div>
          <div v-if="showNewCategoryInput" class="flex gap-2 mt-2">
            <input
              v-model="newCategoryInput"
              type="text"
              placeholder="New category..."
              class="flex-1 px-3 py-2 bg-bg-card border border-border-light rounded-xl text-sm focus:outline-none focus:border-accent"
              @keyup.enter="addNewCategory"
            />
            <button
              class="px-3 py-2 rounded-xl text-xs font-medium text-white bg-accent"
              @click="addNewCategory"
            >
              Add
            </button>
            <button
              class="px-3 py-2 rounded-xl text-xs font-medium text-text-secondary bg-bg-card"
              @click="showNewCategoryInput = false; newCategoryInput = ''"
            >
              Cancel
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-text-secondary mb-2">Quantity (g)</label>
          <div class="flex items-center gap-3">
            <button
              class="w-10 h-10 flex items-center justify-center rounded-xl bg-bg-card text-lg font-bold"
              @click="intakeQuantity = Math.max(10, intakeQuantity - 10)"
            >-</button>
            <input
              v-model.number="intakeQuantity"
              type="number"
              min="1"
              class="flex-1 text-center py-2.5 bg-bg-card border border-border-light rounded-xl text-lg font-semibold focus:outline-none focus:border-accent"
            />
            <button
              class="w-10 h-10 flex items-center justify-center rounded-xl bg-bg-card text-lg font-bold"
              @click="intakeQuantity += 10"
            >+</button>
          </div>
          <p class="text-center text-sm text-calories font-semibold mt-2">{{ estimatedCalories }} kcal</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-text-secondary mb-2">Meal</label>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="meal in mealTypes"
              :key="meal.value"
              class="py-2 rounded-xl text-xs font-medium transition-all"
              :class="intakeMealType === meal.value ? 'bg-accent text-white' : 'bg-bg-card text-text-secondary'"
              @click="intakeMealType = meal.value"
            >
              {{ meal.label }}
            </button>
          </div>
        </div>

        <button
          @click="saveIntake"
          class="w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-accent active:scale-[0.98] transition-transform"
        >
          Add to Log
        </button>
      </div>
    </Modal>
  </div>
</template>
