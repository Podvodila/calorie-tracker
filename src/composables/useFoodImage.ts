import { ref, watch, onUnmounted, type Ref } from 'vue'
import type { Food } from '@/db/types'

export function useFoodImage(food: Ref<Food>) {
  const imageSrc = ref<string | null>(null)
  let currentBlobUrl: string | null = null

  function revokeBlobUrl() {
    if (currentBlobUrl) {
      URL.revokeObjectURL(currentBlobUrl)
      currentBlobUrl = null
    }
  }

  watch(food, (f) => {
    revokeBlobUrl()
    imageSrc.value = null
    if (!f) return

    if (f.imageBlob) {
      currentBlobUrl = URL.createObjectURL(f.imageBlob)
      imageSrc.value = currentBlobUrl
    } else if (f.imageUrl) {
      imageSrc.value = f.imageUrl
    }
  }, { immediate: true })

  onUnmounted(revokeBlobUrl)

  return { imageSrc }
}
