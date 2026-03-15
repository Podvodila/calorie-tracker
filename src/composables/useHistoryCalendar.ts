import { ref, computed, watch } from 'vue'
import { db } from '@/db/database'
import type { NutritionSummary } from '@/db/types'

export interface DayData {
  date: string
  calories: number
  status: 'on-target' | 'over' | 'under' | 'no-data'
}

export function useHistoryCalendar() {
  const currentYear = ref(new Date().getFullYear())
  const currentMonth = ref(new Date().getMonth())
  const selectedDate = ref<string | null>(null)
  const dayData = ref<Map<string, DayData>>(new Map())

  const monthLabel = computed(() => {
    const date = new Date(currentYear.value, currentMonth.value, 1)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  })

  function prevMonth() {
    if (currentMonth.value === 0) {
      currentMonth.value = 11
      currentYear.value--
    } else {
      currentMonth.value--
    }
  }

  function nextMonth() {
    if (currentMonth.value === 11) {
      currentMonth.value = 0
      currentYear.value++
    } else {
      currentMonth.value++
    }
  }

  async function loadMonthData() {
    const year = currentYear.value
    const month = currentMonth.value
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`

    const entries = await db.intakeLog
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray()

    const plans = await db.plan.toArray()
    const targetCalories = plans[0]?.dailyCalories ?? 2000

    const dataMap = new Map<string, DayData>()

    // Group entries by date and compute totals
    const dailyTotals = new Map<string, number>()
    for (const entry of entries) {
      const current = dailyTotals.get(entry.date) || 0
      let cals = 0
      if (entry.foodId) {
        const food = await db.foods.get(entry.foodId)
        if (food) cals = food.calories * (entry.quantity / 100)
      } else if (entry.recipeId) {
        const items = await db.recipeItems.where('recipeId').equals(entry.recipeId).toArray()
        for (const item of items) {
          const food = await db.foods.get(item.foodId)
          if (food) cals += food.calories * (item.quantity / 100)
        }
        cals = cals * (entry.quantity / 100)
      }
      dailyTotals.set(entry.date, current + cals)
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const totalCals = dailyTotals.get(dateStr)

      let status: DayData['status'] = 'no-data'
      if (totalCals !== undefined) {
        const ratio = totalCals / targetCalories
        if (ratio > 1.1) status = 'over'
        else if (ratio >= 0.8) status = 'on-target'
        else status = 'under'
      }

      dataMap.set(dateStr, {
        date: dateStr,
        calories: Math.round(totalCals || 0),
        status,
      })
    }

    dayData.value = dataMap
  }

  watch([currentYear, currentMonth], () => loadMonthData(), { immediate: true })

  return {
    currentYear,
    currentMonth,
    selectedDate,
    dayData,
    monthLabel,
    prevMonth,
    nextMonth,
    loadMonthData,
  }
}
