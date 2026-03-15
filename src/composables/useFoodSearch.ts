import { ref, watch, shallowRef, onScopeDispose } from 'vue'
import { refDebounced } from '@vueuse/core'
import { liveQuery } from 'dexie'
import { from, type Subscription } from 'rxjs'
import { db } from '@/db/database'
import type { Food } from '@/db/types'
import { useUserCategories } from './useUserCategories'

export function useFoodSearch() {
  const { categories } = useUserCategories()
  const query = ref('')
  const debouncedQuery = refDebounced(query, 200)
  const results = shallowRef<Food[]>([])
  const selectedCategory = ref<string | null>(null)
  const isSearching = ref(false)
  let subscription: Subscription | null = null

  watch([debouncedQuery, selectedCategory], ([q, cat]) => {
    isSearching.value = true

    if (subscription) {
      subscription.unsubscribe()
    }

    const observable = from(liveQuery(async () => {
      let collection
      if (q && q.length > 0) {
        collection = db.foods.where('name').startsWithIgnoreCase(q)
      } else {
        collection = db.foods.orderBy('lastUsed')
      }

      let items = await collection.reverse().toArray()

      if (cat) {
        items = items.filter(f => f.category === cat)
      }

      return items.slice(0, 50)
    }))

    subscription = observable.subscribe({
      next: (items) => {
        results.value = items
        isSearching.value = false
      },
      error: () => {
        results.value = []
        isSearching.value = false
      },
    })
  }, { immediate: true })

  onScopeDispose(() => {
    if (subscription) subscription.unsubscribe()
  })

  function clearSearch() {
    query.value = ''
    selectedCategory.value = null
  }

  return { query, results, selectedCategory, categories, isSearching, clearSearch }
}
