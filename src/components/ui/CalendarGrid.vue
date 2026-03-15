<script setup lang="ts">
import { computed } from 'vue'
import type { DayData } from '@/composables/useHistoryCalendar'

const props = defineProps<{
  year: number
  month: number
  dayData: Map<string, DayData>
  selectedDate: string | null
}>()

const emit = defineEmits<{
  selectDate: [date: string]
}>()

const weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

const calendarDays = computed(() => {
  const firstDay = new Date(props.year, props.month, 1)
  const daysInMonth = new Date(props.year, props.month + 1, 0).getDate()
  // Monday = 0, Sunday = 6
  let startDay = firstDay.getDay() - 1
  if (startDay < 0) startDay = 6

  const days: (number | null)[] = []
  for (let i = 0; i < startDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)

  return days
})

function getDateStr(day: number) {
  return `${props.year}-${String(props.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getDayStatus(day: number) {
  const dateStr = getDateStr(day)
  return props.dayData.get(dateStr)?.status ?? 'no-data'
}

function getDayCalories(day: number) {
  const dateStr = getDateStr(day)
  return props.dayData.get(dateStr)?.calories ?? 0
}

const statusColors: Record<string, string> = {
  'on-target': 'bg-success/20 text-success',
  'over': 'bg-danger/20 text-danger',
  'under': 'bg-warning/20 text-warning',
  'no-data': 'bg-transparent text-text-muted',
}
</script>

<template>
  <div>
    <div class="grid grid-cols-7 gap-1 mb-2">
      <div v-for="day in weekDays" :key="day" class="text-center text-[10px] font-medium text-text-muted py-1">
        {{ day }}
      </div>
    </div>
    <div class="grid grid-cols-7 gap-1">
      <div v-for="(day, idx) in calendarDays" :key="idx" class="aspect-square">
        <button
          v-if="day"
          class="w-full h-full rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all"
          :class="[
            statusColors[getDayStatus(day)],
            selectedDate === getDateStr(day) ? 'ring-2 ring-accent' : ''
          ]"
          @click="emit('selectDate', getDateStr(day))"
        >
          <span>{{ day }}</span>
          <span v-if="getDayCalories(day) > 0" class="text-[8px] opacity-70">{{ getDayCalories(day) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
