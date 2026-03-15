<script setup lang="ts">
import { reactive, ref, watch, computed } from 'vue'
import { usePlan } from '@/composables/usePlan'
import { useExportImport } from '@/composables/useExportImport'
import { useFoodDatabase, COUNTRIES } from '@/composables/useFoodDatabase'
import { useToast } from '@/composables/useToast'
import ProgressBar from '@/components/ui/ProgressBar.vue'

const { plan, savePlan } = usePlan()
const { exportData, importData, isExporting, isImporting } = useExportImport()

const appVersion = computed(() => {
  const d = new Date(__APP_VERSION__)
  return `v ${d.toLocaleDateString('en-CA')} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
})
const { countryCounts, isDownloading, downloadProgress, downloadCountry, deleteCountry, cancelDownload } = useFoodDatabase()
const toast = useToast()

const form = reactive({
  dailyProtein: 150,
  dailyCarbs: 250,
  dailyFat: 65,
})

const calculatedCalories = computed(() => form.dailyProtein * 4 + form.dailyCarbs * 4 + form.dailyFat * 9)
const isSaving = ref(false)

watch(plan, (p) => {
  if (p) {
    form.dailyProtein = p.dailyProtein
    form.dailyCarbs = p.dailyCarbs
    form.dailyFat = p.dailyFat
  }
}, { immediate: true })

async function save() {
  isSaving.value = true
  try {
    await savePlan({ ...form, dailyCalories: calculatedCalories.value })
    toast.success('Plan saved!')
  } finally {
    isSaving.value = false
  }
}

async function handleDownload(code: string) {
  try {
    await downloadCountry(code)
    toast.success('Download complete!')
  } catch {
    toast.error('Download failed')
  }
}

async function handleDelete(code: string, label: string) {
  if (!confirm(`Remove all ${label} food data?`)) return
  await deleteCountry(code)
  toast.success(`${label} data removed`)
}

async function handleExport() {
  await exportData()
  toast.success('Data exported!')
}

function handleImportClick() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      const result = await importData(file)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    }
  }
  input.click()
}

function formatCount(n: number): string {
  return n.toLocaleString()
}
</script>

<template>
  <div class="p-5 space-y-6">
    <section class="space-y-4">
      <h2 class="text-lg font-bold font-display">Daily Goals</h2>

      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-text-secondary mb-1">
            <span class="inline-block w-3 h-3 rounded-full bg-calories mr-1.5 align-middle"></span>
            Calories (kcal)
          </label>
          <div class="w-full px-3 py-2.5 bg-bg-card border border-border-light rounded-xl text-sm text-text-muted">
            {{ calculatedCalories }}
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-text-secondary mb-1">
            <span class="inline-block w-3 h-3 rounded-full bg-protein mr-1.5 align-middle"></span>
            Protein (g)
          </label>
          <input v-model.number="form.dailyProtein" type="number" min="0" class="w-full px-3 py-2.5 bg-bg-card border border-border-light rounded-xl text-sm focus:outline-none focus:border-accent" />
        </div>

        <div>
          <label class="block text-sm font-medium text-text-secondary mb-1">
            <span class="inline-block w-3 h-3 rounded-full bg-carbs mr-1.5 align-middle"></span>
            Carbs (g)
          </label>
          <input v-model.number="form.dailyCarbs" type="number" min="0" class="w-full px-3 py-2.5 bg-bg-card border border-border-light rounded-xl text-sm focus:outline-none focus:border-accent" />
        </div>

        <div>
          <label class="block text-sm font-medium text-text-secondary mb-1">
            <span class="inline-block w-3 h-3 rounded-full bg-fat mr-1.5 align-middle"></span>
            Fat (g)
          </label>
          <input v-model.number="form.dailyFat" type="number" min="0" class="w-full px-3 py-2.5 bg-bg-card border border-border-light rounded-xl text-sm focus:outline-none focus:border-accent" />
        </div>
      </div>
    </section>

    <button
      @click="save"
      :disabled="isSaving"
      class="w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-accent active:scale-[0.98] transition-transform disabled:opacity-50"
    >
      {{ isSaving ? 'Saving...' : 'Save Plan' }}
    </button>

    <section class="space-y-3">
      <h2 class="text-lg font-bold font-display">Food Database</h2>

      <div class="space-y-2">
        <div
          v-for="c in COUNTRIES"
          :key="c.code"
          class="flex items-center justify-between p-3 bg-bg-card rounded-xl"
        >
          <div class="min-w-0">
            <p class="text-sm font-medium">{{ c.label }}</p>
            <p v-if="(countryCounts?.[c.code] ?? 0) > 0" class="text-xs text-text-muted">
              {{ formatCount(countryCounts![c.code]) }} foods
            </p>
          </div>

          <!-- Downloading this country -->
          <div
            v-if="isDownloading && downloadProgress?.country === c.code"
            class="flex items-center gap-2 flex-1 ml-3"
          >
            <div class="flex-1">
              <ProgressBar
                :current="downloadProgress.fetched"
                :target="downloadProgress.total || downloadProgress.fetched + 100"
                color="var(--color-accent, #6366f1)"
                :label="'Page ' + downloadProgress.page"
              />
            </div>
            <button
              @click="cancelDownload"
              class="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 bg-red-500/10 shrink-0"
            >
              Cancel
            </button>
          </div>

          <!-- Has data: show delete -->
          <button
            v-else-if="(countryCounts?.[c.code] ?? 0) > 0"
            @click="handleDelete(c.code, c.label)"
            class="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 bg-red-500/10"
          >
            Remove
          </button>

          <!-- No data: show download -->
          <button
            v-else
            @click="handleDownload(c.code)"
            :disabled="isDownloading"
            class="px-3 py-1.5 rounded-lg text-xs font-medium text-accent bg-accent/10 disabled:opacity-50"
          >
            Download
          </button>
        </div>
      </div>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-bold font-display">Data Management</h2>
      <div class="flex gap-3">
        <button
          @click="handleExport"
          :disabled="isExporting"
          class="flex-1 py-3 rounded-xl text-sm font-medium text-accent bg-accent/10 active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {{ isExporting ? 'Exporting...' : 'Export Data' }}
        </button>
        <button
          @click="handleImportClick"
          :disabled="isImporting"
          class="flex-1 py-3 rounded-xl text-sm font-medium text-accent bg-accent/10 active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {{ isImporting ? 'Importing...' : 'Import Data' }}
        </button>
      </div>
    </section>

    <p class="text-xs text-text-muted text-center">{{ appVersion }}</p>
  </div>
</template>
