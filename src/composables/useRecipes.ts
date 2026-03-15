import { useObservable } from '@vueuse/rxjs'
import { liveQuery } from 'dexie'
import { from } from 'rxjs'
import { db } from '@/db/database'
import type { Recipe, RecipeItem, NutritionSummary } from '@/db/types'

export function useRecipes() {
  const recipes = useObservable(
    from(liveQuery(() => db.recipes.toArray()))
  )

  async function addRecipe(recipe: Omit<Recipe, 'id'>, items: Omit<RecipeItem, 'id' | 'recipeId'>[]) {
    return await db.transaction('rw', [db.recipes, db.recipeItems], async () => {
      const recipeId = await db.recipes.add(recipe as Recipe)
      for (const item of items) {
        await db.recipeItems.add({ ...item, recipeId: recipeId as number })
      }
      return recipeId
    })
  }

  async function updateRecipe(id: number, recipe: Partial<Recipe>, items?: Omit<RecipeItem, 'id' | 'recipeId'>[]) {
    await db.transaction('rw', [db.recipes, db.recipeItems], async () => {
      await db.recipes.update(id, recipe)
      if (items) {
        await db.recipeItems.where('recipeId').equals(id).delete()
        for (const item of items) {
          await db.recipeItems.add({ ...item, recipeId: id })
        }
      }
    })
  }

  async function deleteRecipe(id: number) {
    await db.transaction('rw', [db.recipes, db.recipeItems], async () => {
      await db.recipeItems.where('recipeId').equals(id).delete()
      await db.recipes.delete(id)
    })
  }

  async function getRecipeItems(recipeId: number) {
    return await db.recipeItems.where('recipeId').equals(recipeId).toArray()
  }

  async function getRecipeNutrition(recipeId: number): Promise<NutritionSummary> {
    const items = await db.recipeItems.where('recipeId').equals(recipeId).toArray()
    const summary: NutritionSummary = { calories: 0, protein: 0, carbs: 0, fat: 0 }

    for (const item of items) {
      const food = await db.foods.get(item.foodId)
      if (food) {
        const ratio = item.quantity / 100
        summary.calories += food.calories * ratio
        summary.protein += food.protein * ratio
        summary.carbs += food.carbs * ratio
        summary.fat += food.fat * ratio
      }
    }

    return {
      calories: Math.round(summary.calories),
      protein: Math.round(summary.protein),
      carbs: Math.round(summary.carbs),
      fat: Math.round(summary.fat),
    }
  }

  return { recipes, addRecipe, updateRecipe, deleteRecipe, getRecipeItems, getRecipeNutrition }
}
