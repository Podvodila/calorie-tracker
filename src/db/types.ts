export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type FoodSource = 'api' | 'user'

export interface Food {
  id?: number
  name: string
  brand?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fatSaturated?: number
  fatMono?: number
  fatPoly?: number
  category?: string
  categories?: string[]
  quantity?: number
  unit?: string
  country?: string
  stores?: string
  imageUrl?: string
  imageBlob?: Blob
  source: FoodSource
  lastUsed?: number
}

export interface Recipe {
  id?: number
  name: string
  category?: string
}

export interface RecipeItem {
  id?: number
  recipeId: number
  foodId: number
  quantity: number
}

export interface IntakeLogEntry {
  id?: number
  foodId?: number
  recipeId?: number
  date: string  // YYYY-MM-DD
  quantity: number
  mealType: MealType
}

export interface Plan {
  id?: number
  dailyCalories: number
  dailyProtein: number
  dailyCarbs: number
  dailyFat: number
  country: string
}

export interface UserCategory {
  id?: number
  name: string
}

export interface NutritionSummary {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface IntakeWithFood extends IntakeLogEntry {
  food?: Food
  recipe?: Recipe
  recipeNutrition?: NutritionSummary
}
