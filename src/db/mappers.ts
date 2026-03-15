import type { Food } from './types'

export function mapOpenFoodFactsProduct(p: any, country: string): Food | null {
  if (!p.product_name) return null

  return {
    name: p.brands ? `${p.brands} - ${p.product_name}` : p.product_name,
    brand: p.brands || undefined,
    calories: Math.round(p.nutriments?.['energy-kcal_100g'] || 0),
    protein: Math.round((p.nutriments?.proteins_100g || 0) * 10) / 10,
    carbs: Math.round((p.nutriments?.carbohydrates_100g || 0) * 10) / 10,
    fat: Math.round((p.nutriments?.fat_100g || 0) * 10) / 10,
    fatSaturated: p.nutriments?.['saturated-fat_100g'] || undefined,
    fatMono: p.nutriments?.['monounsaturated-fat_100g'] || undefined,
    fatPoly: p.nutriments?.['polyunsaturated-fat_100g'] || undefined,
    category: p.categories_tags?.[0]?.replace('en:', '') || undefined,
    categories: p.categories_tags?.map((c: string) => c.replace('en:', '')) || [],
    quantity: parseFloat(p.quantity) || undefined,
    unit: p.quantity?.includes('ml') ? 'ml' : 'g',
    country,
    stores: p.stores || undefined,
    imageUrl: p.image_url || undefined,
    source: 'api' as const,
    lastUsed: 0,
  }
}
