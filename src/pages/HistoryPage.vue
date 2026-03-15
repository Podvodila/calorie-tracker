<script setup lang="ts">
import { ref, watch } from 'vue'
import { useHistoryCalendar } from '@/composables/useHistoryCalendar'
import { useIntakeLog } from '@/composables/useIntakeLog'
import { usePlan } from '@/composables/usePlan'
import CalendarGrid from '@/components/ui/CalendarGrid.vue'
import MacroSummary from '@/components/ui/MacroSummary.vue'
import MealGroup from '@/components/intake/MealGroup.vue'
import type { MealType } from '@/db/types'

const {
  currentYear,
  currentMonth,
  selectedDate,
  dayData,
  monthLabel,
  prevMonth,
  nextMonth,
} = useHistoryCalendar()

const { plan } = usePlan()

const selectedDateStr = ref<string>(new Date().toISOString().split('T')[0])

function handleSelectDate(date: string) {
  selectedDate.value = date
  selectedDateStr.value = date
}

const dateGetter = () => selectedDateStr.value
const { dailyTotals, mealGroups } = useIntakeLog(dateGetter)

const mealOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

const hasMeals = () => {
  return mealOrder.some(m => mealGroups.value[m]?.length > 0)
}
</script>

<template>
  <div class="p-5 space-y-5">
    <!-- Month Navigation -->
    <div class="flex items-center justify-between">
      <button
        @click="prevMonth"
        class="w-10 h-10 flex items-center justify-center rounded-xl bg-bg-card"
      >
        <svg class="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h2 class="text-lg font-bold font-display">{{ monthLabel }}</h2>
      <button
        @click="nextMonth"
        class="w-10 h-10 flex items-center justify-center rounded-xl bg-bg-card"
      >
        <svg class="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <!-- Calendar -->
    <div class="bg-bg-card p-4 rounded-2xl">
      <CalendarGrid
        :year="currentYear"
        :month="currentMonth"
        :day-data="dayData"
        :selected-date="selectedDate"
        @select-date="handleSelectDate"
      />
    </div>

    <!-- Legend -->
    <div class="flex items-center justify-center gap-4 text-xs text-text-muted">
      <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-success/20"></span> On target</span>
      <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-danger/20"></span> Over</span>
      <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-warning/20"></span> Under</span>
    </div>

    <!-- Selected Day Detail -->
    <div v-if="selectedDate" class="space-y-4">
      <h3 class="text-sm font-semibold text-text-secondary">
        {{ new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) }}
      </h3>
      <MacroSummary :nutrition="dailyTotals" :plan="plan" />

      <div class="space-y-3">
        <MealGroup
          v-for="meal in mealOrder"
          :key="meal"
          :meal-type="meal"
          :items="mealGroups[meal]"
        />
      </div>

      <p v-if="!hasMeals()" class="text-center text-text-muted text-sm py-4">
        No meals logged for this day
      </p>
    </div>
  </div>
</template>
