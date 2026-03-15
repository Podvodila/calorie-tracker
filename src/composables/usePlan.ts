import { computed } from 'vue'
import { useObservable } from '@vueuse/rxjs'
import { liveQuery } from 'dexie'
import { from } from 'rxjs'
import { db } from '@/db/database'
import type { Plan } from '@/db/types'

const defaultPlan: Plan = {
  dailyCalories: 2185,
  dailyProtein: 150,
  dailyCarbs: 250,
  dailyFat: 65,
  country: 'world',
}

export function usePlan() {
  const plans = useObservable(from(liveQuery(() => db.plan.toArray())))

  const plan = computed<Plan>(() => {
    return plans.value?.[0] ?? defaultPlan
  })

  async function savePlan(updates: Partial<Plan>) {
    const existing = await db.plan.toArray()
    if (existing.length > 0) {
      await db.plan.update(existing[0].id!, updates)
    } else {
      await db.plan.add({ ...defaultPlan, ...updates })
    }
  }

  return { plan, savePlan }
}
