import { useObservable } from '@vueuse/rxjs'
import { liveQuery } from 'dexie'
import { from } from 'rxjs'
import { db } from '@/db/database'
import type { Food } from '@/db/types'

export function useFoods() {
  const foods = useObservable(
    from(liveQuery(() => db.foods.where('source').equals('user').toArray()))
  )

  async function addFood(food: Omit<Food, 'id'>) {
    return await db.foods.add(food)
  }

  async function updateFood(id: number, updates: Partial<Food>) {
    await db.foods.update(id, updates)
  }

  async function deleteFood(id: number) {
    await db.foods.delete(id)
  }

  async function getFood(id: number) {
    return await db.foods.get(id)
  }

  return { foods, addFood, updateFood, deleteFood, getFood }
}
