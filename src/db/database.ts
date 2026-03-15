import Dexie, { type Table } from 'dexie'
import type { Food, Recipe, RecipeItem, IntakeLogEntry, Plan, UserCategory } from './types'

export class CalorieTrackerDB extends Dexie {
  foods!: Table<Food>
  recipes!: Table<Recipe>
  recipeItems!: Table<RecipeItem>
  intakeLog!: Table<IntakeLogEntry>
  plan!: Table<Plan>
  userCategories!: Table<UserCategory>

  constructor() {
    super('CalorieTrackerDB')
    this.version(1).stores({
      foods: '++id, name, brand, calories, protein, carbs, fat, category, *categories, source, lastUsed',
      recipes: '++id, &name, category',
      recipeItems: '++id, recipeId, foodId',
      intakeLog: '++id, foodId, recipeId, date, mealType',
      plan: '++id',
    })
    this.version(2).stores({
      foods: '++id, name, brand, calories, protein, carbs, fat, category, *categories, source, lastUsed, [source+country]',
    })
    this.version(3).upgrade(async (tx) => {
      await tx.table('foods').where('source').equals('api').modify((food: Food) => {
        delete food.imageBlob
      })
    })
    this.version(4).stores({
      userCategories: '++id, &name',
    })
  }
}

export const db = new CalorieTrackerDB()
