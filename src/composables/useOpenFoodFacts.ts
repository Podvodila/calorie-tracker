import { ref } from 'vue'
import { db } from '@/db/database'
import { mapOpenFoodFactsProduct } from '@/db/mappers'
import type { Food } from '@/db/types'

export function useOpenFoodFacts() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function searchOnline(query: string, country: string = 'world'): Promise<Food[]> {
    isLoading.value = true
    error.value = null

    try {
      const url = `https://${country}.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&page_size=50&search_terms=${encodeURIComponent(query)}`
      const response = await fetch(url)
      const data = await response.json()

      const foods: Food[] = (data.products || [])
        .map((p: any) => mapOpenFoodFactsProduct(p, country))
        .filter((f: Food | null): f is Food => f !== null)

      return foods
    } catch (e: any) {
      error.value = e.message || 'Failed to search online'
      return []
    } finally {
      isLoading.value = false
    }
  }

  async function importFood(food: Food): Promise<number> {
    const id = await db.foods.add(food)
    return id as number
  }

  return { searchOnline, importFood, isLoading, error }
}
