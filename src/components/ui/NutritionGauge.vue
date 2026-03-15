<script setup lang="ts">
import { computed } from 'vue'
import type { NutritionSummary, Plan } from '@/db/types'

const props = defineProps<{
  nutrition: NutritionSummary
  plan: Plan
}>()

const COLORS = {
  protein: '#42A5F5',
  fat: '#F5B731',
  carbs: '#F87171',
}

const cx = 150
const cy = 165
const outerR = 130
const innerR = 100
const strokeW = 24
const gapDeg = 0
const labelR = outerR + 20

interface Segment {
  key: 'protein' | 'fat' | 'carbs'
  label: string
  grams: number
  color: string
}

function buildSegments(protein: number, fat: number, carbs: number): Segment[] {
  return [
    { key: 'protein', label: 'Protein', grams: protein, color: COLORS.protein },
    { key: 'fat', label: 'Fat', grams: fat, color: COLORS.fat },
    { key: 'carbs', label: 'Carbs', grams: carbs, color: COLORS.carbs },
  ]
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) }
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polarToCartesian(cx, cy, r, startDeg)
  const end = polarToCartesian(cx, cy, r, endDeg)
  const sweep = startDeg - endDeg
  const largeArc = sweep > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`
}

interface ArcSegment {
  key: string
  path: string
  color: string
  opacity: number
  label: string
  grams: number
  midAngle: number
  spanDeg: number
  startDeg: number
  endDeg: number
}

function computeArcs(segments: Segment[], radius: number, opacity: number): ArcSegment[] {
  const total = segments.reduce((s, seg) => s + seg.grams, 0)
  if (total === 0) return []

  const nonZero = segments.filter(s => s.grams > 0)
  const totalGapDeg = gapDeg * (nonZero.length > 1 ? nonZero.length : 0)
  const availableDeg = 180 - totalGapDeg

  const arcs: ArcSegment[] = []
  let cursor = 180

  for (const seg of segments) {
    if (seg.grams <= 0) continue
    const spanDeg = (seg.grams / total) * availableDeg
    const startDeg = cursor
    const endDeg = cursor - spanDeg
    const midAngle = (startDeg + endDeg) / 2

    arcs.push({
      key: seg.key,
      path: arcPath(cx, cy, radius, startDeg, endDeg),
      color: seg.color,
      opacity,
      label: seg.label,
      grams: seg.grams,
      midAngle,
      spanDeg,
      startDeg,
      endDeg,
    })

    cursor = endDeg - gapDeg
  }

  return arcs
}

const outerArcs = computed(() =>
  computeArcs(
    buildSegments(props.plan.dailyProtein, props.plan.dailyFat, props.plan.dailyCarbs),
    outerR,
    0.35,
  ),
)

const innerArcs = computed(() =>
  computeArcs(
    buildSegments(props.nutrition.protein, props.nutrition.fat, props.nutrition.carbs),
    innerR,
    1,
  ),
)

const caloriesDiff = computed(() => props.nutrition.calories - props.plan.dailyCalories)
const caloriesOver = computed(() => caloriesDiff.value > 0)
const caloriesLabel = computed(() => {
  const diff = caloriesDiff.value
  if (diff > 0) return `+${diff} kcal`
  return `${diff} kcal`
})


function labelPos(midAngle: number, radius: number, offset: number = 0) {
  const r = radius + offset
  const p = polarToCartesian(cx, cy, r, midAngle)
  return { x: p.x, y: p.y }
}

function endCap(arcs: ArcSegment[], radius: number) {
  if (arcs.length === 0) return { start: { x: 0, y: 0, color: '', opacity: 0 }, end: { x: 0, y: 0, color: '', opacity: 0 } }
  const first = arcs[0]
  const last = arcs[arcs.length - 1]
  const s = polarToCartesian(cx, cy, radius, first.startDeg)
  const e = polarToCartesian(cx, cy, radius, last.endDeg)
  return {
    start: { ...s, color: first.color, opacity: first.opacity },
    end: { ...e, color: last.color, opacity: last.opacity },
  }
}

const outerCaps = computed(() => endCap(outerArcs.value, outerR))
const innerCaps = computed(() => endCap(innerArcs.value, innerR))

function labelArcPath(startDeg: number, endDeg: number) {
  return arcPath(cx, cy, labelR, startDeg, endDeg)
}
</script>

<template>
  <div class="bg-bg-card rounded-2xl px-2 pt-2 pb-3">
    <svg viewBox="0 15 300 178" class="w-full" style="max-height: 200px">
      <defs>
        <!-- Label arc paths for curved text -->
        <path
          v-for="arc in outerArcs"
          :key="'def-' + arc.key"
          :id="'label-arc-' + arc.key"
          :d="labelArcPath(arc.startDeg, arc.endDeg)"
          fill="none"
        />
      </defs>

      <!-- Outer ring (target) — group opacity so end caps don't double-blend -->
      <g
        v-for="(arc, i) in outerArcs"
        :key="'outer-' + arc.key"
        :opacity="arc.opacity"
      >
        <circle v-if="i === 0" :cx="outerCaps.start.x" :cy="outerCaps.start.y" :r="strokeW / 2" :fill="arc.color" />
        <path :d="arc.path" fill="none" :stroke="arc.color" :stroke-width="strokeW" stroke-linecap="butt" />
        <circle v-if="i === outerArcs.length - 1" :cx="outerCaps.end.x" :cy="outerCaps.end.y" :r="strokeW / 2" :fill="arc.color" />
      </g>

      <!-- Inner ring (current) — group opacity for consistent end caps -->
      <g
        v-for="(arc, i) in innerArcs"
        :key="'inner-' + arc.key"
        :opacity="arc.opacity"
      >
        <circle v-if="i === 0" :cx="innerCaps.start.x" :cy="innerCaps.start.y" :r="strokeW / 2" :fill="arc.color" />
        <path :d="arc.path" fill="none" :stroke="arc.color" :stroke-width="strokeW" stroke-linecap="butt" />
        <circle v-if="i === innerArcs.length - 1" :cx="innerCaps.end.x" :cy="innerCaps.end.y" :r="strokeW / 2" :fill="arc.color" />
      </g>

      <!-- Empty state ring -->
      <path
        v-if="innerArcs.length === 0"
        :d="arcPath(cx, cy, innerR, 178, 2)"
        fill="none"
        stroke="#E5E2DB"
        stroke-opacity="0.5"
        :stroke-width="strokeW"
        stroke-linecap="round"
      />

      <!-- Outer ring labels (target values) -->
      <template v-for="arc in outerArcs" :key="'olabel-' + arc.key">
        <text
          v-if="arc.spanDeg > 12"
          :x="labelPos(arc.midAngle, outerR, 0).x"
          :y="labelPos(arc.midAngle, outerR, 0).y"
          text-anchor="middle"
          dominant-baseline="central"
          class="text-[8px] font-semibold fill-white/80 pointer-events-none select-none"
        >{{ Math.round(arc.grams) }}g</text>
      </template>

      <!-- Inner ring labels (current values) -->
      <template v-for="arc in innerArcs" :key="'ilabel-' + arc.key">
        <text
          v-if="arc.spanDeg > 12"
          :x="labelPos(arc.midAngle, innerR, 0).x"
          :y="labelPos(arc.midAngle, innerR, 0).y"
          text-anchor="middle"
          dominant-baseline="central"
          class="text-[8px] font-bold fill-white pointer-events-none select-none"
        >{{ Math.round(arc.grams) }}g</text>
      </template>

      <!-- Curved macro name labels outside outer ring -->
      <template v-for="arc in outerArcs" :key="'name-' + arc.key">
        <text
          v-if="arc.spanDeg > 22"
          class="text-[9px] font-semibold pointer-events-none select-none"
          :fill="arc.color"
        >
          <textPath
            :href="'#label-arc-' + arc.key"
            startOffset="50%"
            text-anchor="middle"
            dominant-baseline="auto"
          >{{ arc.label }}</textPath>
        </text>
      </template>

      <!-- Center calories -->
      <text
        :x="cx"
        :y="cy - 18"
        text-anchor="middle"
        dominant-baseline="central"
        class="text-[28px] font-bold font-display pointer-events-none select-none"
        :fill="caloriesOver ? '#F87171' : '#1A1A1A'"
      >{{ nutrition.calories }}</text>

      <text
        :x="cx"
        :y="cy + 2"
        text-anchor="middle"
        dominant-baseline="central"
        class="text-[11px] pointer-events-none select-none"
        fill="#9B9B9B"
      >/ {{ plan.dailyCalories }} kcal</text>

      <!-- Remaining / excess label -->
      <text
        :x="cx"
        :y="cy + 18"
        text-anchor="middle"
        dominant-baseline="central"
        class="text-[10px] font-semibold pointer-events-none select-none"
        :fill="caloriesOver ? '#F87171' : '#9B9B9B'"
      >{{ caloriesLabel }}</text>
    </svg>

  </div>
</template>
