import { computed, type Ref } from 'vue'
import { useObservable } from '@vueuse/rxjs'
import { liveQuery } from 'dexie'
import { from } from 'rxjs'
import { db } from '@/db/database'
import type { UserCategory } from '@/db/types'

export function useUserCategories() {
  const rawCategories = useObservable(
    from(liveQuery(() => db.userCategories.toArray()))
  ) as Ref<UserCategory[] | undefined>

  const categories = computed(() =>
    (rawCategories.value || []).map(c => c.name).sort()
  )

  async function addCategory(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    const exists = await db.userCategories.where('name').equals(trimmed).first()
    if (!exists) {
      await db.userCategories.add({ name: trimmed })
    }
  }

  async function countFoodsByCategory(name: string): Promise<number> {
    return db.foods.where('category').equals(name).count()
  }

  async function removeCategory(name: string) {
    await db.foods.where('category').equals(name).modify({ category: undefined })
    await db.userCategories.where('name').equals(name).delete()
  }

  return { categories, addCategory, removeCategory, countFoodsByCategory }
}
