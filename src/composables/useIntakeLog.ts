import { computed } from 'vue'
import { useObservable } from '@vueuse/rxjs'
import { liveQuery } from 'dexie'
import { from } from 'rxjs'
import { db } from '@/db/database'
import type { IntakeLogEntry, IntakeWithFood, NutritionSummary, MealType } from '@/db/types'

export function useIntakeLog(date: () => string) {
  const entries = useObservable(
    from(liveQuery(() => db.intakeLog.where('date').equals(date()).toArray()))
  )

  const entriesWithFood = useObservable(
    from(liveQuery(async () => {
      const logs = await db.intakeLog.where('date').equals(date()).toArray()
      const result: IntakeWithFood[] = []

      for (const log of logs) {
        const entry: IntakeWithFood = { ...log }
        if (log.foodId) {
          entry.food = await db.foods.get(log.foodId)
        }
        if (log.recipeId) {
          entry.recipe = await db.recipes.get(log.recipeId)
          if (entry.recipe) {
            const items = await db.recipeItems.where('recipeId').equals(log.recipeId).toArray()
            const nutrition: NutritionSummary = { calories: 0, protein: 0, carbs: 0, fat: 0 }
            for (const item of items) {
              const food = await db.foods.get(item.foodId)
              if (food) {
                const ratio = item.quantity / 100
                nutrition.calories += food.calories * ratio
                nutrition.protein += food.protein * ratio
                nutrition.carbs += food.carbs * ratio
                nutrition.fat += food.fat * ratio
              }
            }
            entry.recipeNutrition = {
              calories: Math.round(nutrition.calories),
              protein: Math.round(nutrition.protein),
              carbs: Math.round(nutrition.carbs),
              fat: Math.round(nutrition.fat),
            }
          }
        }
        result.push(entry)
      }
      return result
    }))
  )

  const dailyTotals = computed<NutritionSummary>(() => {
    const items = entriesWithFood.value ?? []
    const totals: NutritionSummary = { calories: 0, protein: 0, carbs: 0, fat: 0 }

    for (const entry of items) {
      const ratio = entry.quantity / 100
      if (entry.food) {
        totals.calories += entry.food.calories * ratio
        totals.protein += entry.food.protein * ratio
        totals.carbs += entry.food.carbs * ratio
        totals.fat += entry.food.fat * ratio
      } else if (entry.recipeNutrition) {
        totals.calories += entry.recipeNutrition.calories * ratio
        totals.protein += entry.recipeNutrition.protein * ratio
        totals.carbs += entry.recipeNutrition.carbs * ratio
        totals.fat += entry.recipeNutrition.fat * ratio
      }
    }

    return {
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein),
      carbs: Math.round(totals.carbs),
      fat: Math.round(totals.fat),
    }
  })

  const mealGroups = computed(() => {
    const items = entriesWithFood.value ?? []
    const groups: Record<MealType, IntakeWithFood[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    }
    for (const item of items) {
      groups[item.mealType].push(item)
    }
    return groups
  })

  async function addIntake(entry: Omit<IntakeLogEntry, 'id'>) {
    const id = await db.intakeLog.add(entry as IntakeLogEntry)
    if (entry.foodId) {
      await db.foods.update(entry.foodId, { lastUsed: Date.now() })
    }
    return id
  }

  async function updateIntake(id: number, changes: Partial<Pick<IntakeLogEntry, 'quantity' | 'mealType'>>) {
    await db.intakeLog.update(id, changes)
  }

  async function deleteIntake(id: number) {
    await db.intakeLog.delete(id)
  }

  return { entries, entriesWithFood, dailyTotals, mealGroups, addIntake, updateIntake, deleteIntake }
}
