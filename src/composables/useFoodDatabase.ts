import { ref, type Ref } from 'vue'
import { useObservable } from '@vueuse/rxjs'
import { liveQuery } from 'dexie'
import { from } from 'rxjs'
import { db } from '@/db/database'
import { mapOpenFoodFactsProduct } from '@/db/mappers'

export interface CountryOption {
  code: string
  label: string
}

export interface DownloadProgress {
  country: string
  fetched: number
  total: number
  page: number
}

export const COUNTRIES: CountryOption[] = [
  { code: 'ua', label: 'Ukraine' },
  { code: 'lt', label: 'Lithuania' },
]

export function useFoodDatabase() {
  const isDownloading = ref(false)
  const downloadProgress: Ref<DownloadProgress | null> = ref(null)
  let abortController: AbortController | null = null

  const countryCounts = useObservable(
    from(liveQuery(async () => {
      const counts: Record<string, number> = {}
      for (const c of COUNTRIES) {
        counts[c.code] = await db.foods
          .where('[source+country]')
          .equals(['api', c.code])
          .count()
      }
      return counts
    }))
  )

  async function downloadCountry(code: string) {
    if (isDownloading.value) return

    isDownloading.value = true
    abortController = new AbortController()
    const signal = abortController.signal

    // Clean up any leftover data from previous attempts
    await deleteCountry(code)

    let page = 1
    let totalFetched = 0

    try {
      while (true) {
        if (signal.aborted) break

        const url = `https://${code}.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&page_size=100&page=${page}`

        let data: any
        let lastError = ''
        for (let attempt = 1; attempt <= 5; attempt++) {
          try {
            const response = await fetch(url, { signal })
            if (response.ok) {
              data = await response.json()
              break
            }
            lastError = `Server error: ${response.status}`
          } catch (e: any) {
            if (e.name === 'AbortError') throw e
            lastError = e.message || 'Network error'
          }
          if (attempt === 5) {
            throw new Error(lastError)
          }
          // Wait before retrying: 2s, 4s, 6s, 8s
          await new Promise(r => setTimeout(r, attempt * 2000))
        }

        const products = data.products || []
        if (products.length === 0) break

        const totalProducts = data.count || 0

        const foods = products
          .map((p: any) => mapOpenFoodFactsProduct(p, code))
          .filter((f: any): f is NonNullable<typeof f> => f !== null)

        if (foods.length > 0) {
          await db.foods.bulkAdd(foods).catch(() => {
            // Ignore duplicate key errors from bulkAdd
          })
        }

        totalFetched += products.length
        downloadProgress.value = {
          country: code,
          fetched: totalFetched,
          total: totalProducts,
          page,
        }

        page++
      }
    } catch (e: any) {
      // Clean up partially downloaded data on failure or cancel
      await deleteCountry(code)
      if (e.name !== 'AbortError') {
        throw e
      }
    } finally {
      isDownloading.value = false
      downloadProgress.value = null
      abortController = null
    }
  }

  async function deleteCountry(code: string) {
    await db.foods
      .where('[source+country]')
      .equals(['api', code])
      .delete()
  }

  function cancelDownload() {
    abortController?.abort()
  }

  return {
    countryCounts,
    isDownloading,
    downloadProgress,
    downloadCountry,
    deleteCountry,
    cancelDownload,
  }
}
