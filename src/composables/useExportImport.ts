import { ref } from 'vue'
import { db } from '@/db/database'

export function useExportImport() {
  const isExporting = ref(false)
  const isImporting = ref(false)

  async function exportData() {
    isExporting.value = true
    try {
      const data = {
        version: 1,
        exportDate: new Date().toISOString(),
        foods: await db.foods.toArray(),
        recipes: await db.recipes.toArray(),
        recipeItems: await db.recipeItems.toArray(),
        intakeLog: await db.intakeLog.toArray(),
        plan: await db.plan.toArray(),
      }

      // Remove blobs from export (too large)
      data.foods = data.foods.map(f => {
        const { imageBlob, ...rest } = f as any
        return rest
      })

      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `calorie-tracker-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      isExporting.value = false
    }
  }

  async function importData(file: File): Promise<{ success: boolean; message: string }> {
    isImporting.value = true
    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (!data.version || !data.foods) {
        return { success: false, message: 'Invalid backup file format' }
      }

      await db.transaction('rw', [db.foods, db.recipes, db.recipeItems, db.intakeLog, db.plan], async () => {
        await db.foods.clear()
        await db.recipes.clear()
        await db.recipeItems.clear()
        await db.intakeLog.clear()
        await db.plan.clear()

        if (data.foods?.length) await db.foods.bulkAdd(data.foods)
        if (data.recipes?.length) await db.recipes.bulkAdd(data.recipes)
        if (data.recipeItems?.length) await db.recipeItems.bulkAdd(data.recipeItems)
        if (data.intakeLog?.length) await db.intakeLog.bulkAdd(data.intakeLog)
        if (data.plan?.length) await db.plan.bulkAdd(data.plan)
      })

      return { success: true, message: `Imported ${data.foods.length} foods, ${data.intakeLog?.length || 0} intake entries` }
    } catch (e: any) {
      return { success: false, message: e.message || 'Import failed' }
    } finally {
      isImporting.value = false
    }
  }

  return { exportData, importData, isExporting, isImporting }
}
