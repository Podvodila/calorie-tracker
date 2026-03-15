<script setup lang="ts">
import { reactive, ref, computed, watch, onUnmounted } from 'vue'
import { useUserCategories } from '@/composables/useUserCategories'
import type { Food } from '@/db/types'

const props = defineProps<{
  food?: Food
}>()

const emit = defineEmits<{
  save: [food: Omit<Food, 'id'>]
  cancel: []
}>()

const { categories: userCategories, addCategory, removeCategory, countFoodsByCategory } = useUserCategories()
const newCategoryInput = ref('')
const showNewCategoryInput = ref(false)
const categoryToDelete = ref<string | null>(null)
const categoryDeleteFoodCount = ref(0)

function selectCategory(cat: string | null) {
  form.category = cat || ''
}

async function confirmDeleteCategory(cat: string) {
  categoryDeleteFoodCount.value = await countFoodsByCategory(cat)
  categoryToDelete.value = cat
}

async function executeDeleteCategory() {
  if (!categoryToDelete.value) return
  if (form.category === categoryToDelete.value) {
    form.category = ''
  }
  await removeCategory(categoryToDelete.value)
  categoryToDelete.value = null
}

async function addNewCategoryAndSelect() {
  const name = newCategoryInput.value.trim()
  if (!name) return
  await addCategory(name)
  form.category = name
  newCategoryInput.value = ''
  showNewCategoryInput.value = false
}

const form = reactive({
  name: props.food?.name ?? '',
  brand: props.food?.brand ?? '',
  protein: props.food?.protein ?? 0,
  carbs: props.food?.carbs ?? 0,
  fat: props.food?.fat ?? 0,
  fatSaturated: props.food?.fatSaturated ?? 0,
  fatMono: props.food?.fatMono ?? 0,
  fatPoly: props.food?.fatPoly ?? 0,
  category: props.food?.category ?? '',
  quantity: props.food?.quantity ?? 100,
  unit: props.food?.unit ?? 'g',
})

const calculatedCalories = computed(() =>
  Math.round((form.protein || 0) * 4 + (form.carbs || 0) * 4 + (form.fat || 0) * 9)
)

const fatBreakdownSum = computed(() =>
  (form.fatSaturated || 0) + (form.fatMono || 0) + (form.fatPoly || 0)
)

const fatRemaining = computed(() =>
  Math.max(0, (form.fat || 0) - fatBreakdownSum.value)
)

const maxFatSaturated = computed(() => (form.fatSaturated || 0) + fatRemaining.value)
const maxFatMono = computed(() => (form.fatMono || 0) + fatRemaining.value)
const maxFatPoly = computed(() => (form.fatPoly || 0) + fatRemaining.value)

// Clamp only the edited field to what's available
watch(() => form.fatSaturated, () => {
  const max = Math.max(0, (form.fat || 0) - (form.fatMono || 0) - (form.fatPoly || 0))
  if ((form.fatSaturated || 0) > max) form.fatSaturated = Math.round(max * 10) / 10
})
watch(() => form.fatMono, () => {
  const max = Math.max(0, (form.fat || 0) - (form.fatSaturated || 0) - (form.fatPoly || 0))
  if ((form.fatMono || 0) > max) form.fatMono = Math.round(max * 10) / 10
})
watch(() => form.fatPoly, () => {
  const max = Math.max(0, (form.fat || 0) - (form.fatSaturated || 0) - (form.fatMono || 0))
  if ((form.fatPoly || 0) > max) form.fatPoly = Math.round(max * 10) / 10
})
// When total fat decreases, proportionally scale all breakdown values
watch(() => form.fat, () => {
  const total = form.fat || 0
  const sum = (form.fatSaturated || 0) + (form.fatMono || 0) + (form.fatPoly || 0)
  if (sum > total && sum > 0) {
    const ratio = total / sum
    form.fatSaturated = Math.round((form.fatSaturated || 0) * ratio * 10) / 10
    form.fatMono = Math.round((form.fatMono || 0) * ratio * 10) / 10
    form.fatPoly = Math.round((form.fatPoly || 0) * ratio * 10) / 10
  }
})

const imageBlob = ref<Blob | undefined>(props.food?.imageBlob)
const imagePreview = ref<string | null>(null)

function updatePreview(blob: Blob | undefined) {
  if (imagePreview.value) {
    URL.revokeObjectURL(imagePreview.value)
    imagePreview.value = null
  }
  if (blob) {
    imagePreview.value = URL.createObjectURL(blob)
  }
}

watch(imageBlob, updatePreview, { immediate: true })
onUnmounted(() => {
  if (imagePreview.value) URL.revokeObjectURL(imagePreview.value)
})

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) imageBlob.value = file
}

function removeImage() {
  imageBlob.value = undefined
}

async function submit() {
  if (!form.name.trim()) return
  const category = form.category.trim() || undefined
  if (category) {
    await addCategory(category)
  }
  emit('save', {
    ...form,
    calories: calculatedCalories.value,
    name: form.name.trim(),
    brand: form.brand.trim() || undefined,
    category,
    imageBlob: imageBlob.value,
    source: 'user',
    lastUsed: Date.now(),
  })
}
</script>

<template>
  <form @submit.prevent="submit" class="space-y-4">
    <!-- Image upload -->
    <div>
      <label class="block text-sm font-medium text-text-secondary mb-1">Photo</label>
      <div v-if="imagePreview" class="relative w-24 h-24">
        <img :src="imagePreview" alt="" class="w-full h-full object-cover rounded-xl" />
        <button
          type="button"
          class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
          @click="removeImage"
        >
          &times;
        </button>
      </div>
      <label v-else class="flex items-center justify-center w-24 h-24 border-2 border-dashed border-border-light rounded-xl cursor-pointer text-text-muted hover:border-accent transition-colors">
        <span class="text-2xl">+</span>
        <input type="file" accept="image/*" class="hidden" @change="onFileChange" />
      </label>
    </div>

    <div>
      <label class="block text-sm font-medium text-text-secondary mb-1">Name *</label>
      <input v-model="form.name" type="text" required class="w-full px-3 py-2.5 bg-bg-card border border-border-light rounded-xl text-sm focus:outline-none focus:border-accent" />
    </div>

    <div>
      <label class="block text-sm font-medium text-text-secondary mb-1">Brand</label>
      <input v-model="form.brand" type="text" class="w-full px-3 py-2.5 bg-bg-card border border-border-light rounded-xl text-sm focus:outline-none focus:border-accent" />
    </div>

    <div>
      <label class="block text-sm font-medium text-text-secondary mb-1">Category</label>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
          :class="!form.category ? 'bg-accent text-white' : 'bg-bg-card text-text-secondary'"
          @click="selectCategory(null)"
        >
          None
        </button>
        <span
          v-for="cat in userCategories"
          :key="cat"
          class="inline-flex items-center rounded-full text-xs font-medium transition-all"
          :class="form.category === cat ? 'bg-accent text-white' : 'bg-bg-card text-text-secondary'"
        >
          <button
            type="button"
            class="pl-3 py-1.5 pr-1"
            @click="selectCategory(cat)"
          >
            {{ cat }}
          </button>
          <button
            type="button"
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
          type="button"
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
            type="button"
            class="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-danger"
            @click="executeDeleteCategory"
          >
            Remove
          </button>
          <button
            type="button"
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
          @keyup.enter="addNewCategoryAndSelect"
        />
        <button
          type="button"
          class="px-3 py-2 rounded-xl text-xs font-medium text-white bg-accent"
          @click="addNewCategoryAndSelect"
        >
          Add
        </button>
        <button
          type="button"
          class="px-3 py-2 rounded-xl text-xs font-medium text-text-secondary bg-bg-card"
          @click="showNewCategoryInput = false; newCategoryInput = ''"
        >
          Cancel
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-sm font-medium text-text-secondary mb-1">Serving size</label>
        <input v-model.number="form.quantity" type="number" min="0" class="w-full px-3 py-2.5 bg-bg-card border border-border-light rounded-xl text-sm focus:outline-none focus:border-accent" />
      </div>
      <div>
        <label class="block text-sm font-medium text-text-secondary mb-1">Unit</label>
        <select v-model="form.unit" class="w-full px-3 py-2.5 bg-bg-card border border-border-light rounded-xl text-sm focus:outline-none focus:border-accent">
          <option value="g">g</option>
          <option value="ml">ml</option>
        </select>
      </div>
    </div>

    <p class="text-xs text-text-muted font-medium pt-2">Nutrition per 100{{ form.unit }}</p>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-sm font-medium text-calories mb-1">Calories (kcal)</label>
        <input :value="calculatedCalories" type="number" readonly class="w-full px-3 py-2.5 bg-bg-main border border-border-light rounded-xl text-sm text-text-muted focus:outline-none cursor-default" />
      </div>
      <div>
        <label class="block text-sm font-medium text-protein mb-1">Protein (g)</label>
        <input v-model.number="form.protein" type="number" min="0" step="0.1" class="w-full px-3 py-2.5 bg-bg-card border border-border-light rounded-xl text-sm focus:outline-none focus:border-accent" />
      </div>
      <div>
        <label class="block text-sm font-medium text-carbs mb-1">Carbs (g)</label>
        <input v-model.number="form.carbs" type="number" min="0" step="0.1" class="w-full px-3 py-2.5 bg-bg-card border border-border-light rounded-xl text-sm focus:outline-none focus:border-accent" />
      </div>
      <div>
        <label class="block text-sm font-medium text-fat mb-1">Fat (g)</label>
        <input v-model.number="form.fat" type="number" min="0" step="0.1" class="w-full px-3 py-2.5 bg-bg-card border border-border-light rounded-xl text-sm focus:outline-none focus:border-accent" />
      </div>
    </div>

    <details class="group">
      <summary class="text-xs text-text-muted font-medium cursor-pointer select-none py-1">
        Fat breakdown (optional)
      </summary>
      <div class="grid grid-cols-3 gap-3 pt-2">
        <div>
          <label class="block text-[11px] font-medium text-text-secondary mb-1">Saturated</label>
          <input v-model.number="form.fatSaturated" type="number" min="0" :max="maxFatSaturated" step="0.1" class="w-full px-3 py-2.5 bg-bg-card border border-border-light rounded-xl text-sm focus:outline-none focus:border-accent" />
        </div>
        <div>
          <label class="block text-[11px] font-medium text-text-secondary mb-1">Mono</label>
          <input v-model.number="form.fatMono" type="number" min="0" :max="maxFatMono" step="0.1" class="w-full px-3 py-2.5 bg-bg-card border border-border-light rounded-xl text-sm focus:outline-none focus:border-accent" />
        </div>
        <div>
          <label class="block text-[11px] font-medium text-text-secondary mb-1">Poly</label>
          <input v-model.number="form.fatPoly" type="number" min="0" :max="maxFatPoly" step="0.1" class="w-full px-3 py-2.5 bg-bg-card border border-border-light rounded-xl text-sm focus:outline-none focus:border-accent" />
        </div>
      </div>
      <p class="text-[11px] text-text-muted mt-1.5">{{ fatBreakdownSum.toFixed(1) }}g of {{ (form.fat || 0).toFixed(1) }}g allocated</p>
    </details>

    <div class="flex gap-3 pt-2">
      <button type="button" class="flex-1 py-3 rounded-xl text-sm font-medium text-text-secondary bg-bg-card" @click="emit('cancel')">
        Cancel
      </button>
      <button type="submit" class="flex-1 py-3 rounded-xl text-sm font-medium text-white bg-accent active:scale-[0.98] transition-transform">
        {{ food ? 'Update' : 'Add Food' }}
      </button>
    </div>
  </form>
</template>
