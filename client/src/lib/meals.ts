import { apiRequest, initializeCsrf } from './api'
import type { FoodSearchResult } from './ingredients'

export const meals = [
  { id: 'breakfast', title: 'Colazione' },
  { id: 'morning_snack', title: 'Snack mattutino' },
  { id: 'lunch', title: 'Pranzo' },
  { id: 'afternoon_snack', title: 'Snack pomeridiano' },
  { id: 'dinner', title: 'Cena' },
] as const

export type MealType = typeof meals[number]['id']
export type MealItem = {
  id: number
  date: string
  meal_type: MealType
  food_name: string
  barcode: string | null
  brand: string | null
  quantity_g: string
  calories_per_100g: string | null
  carbohydrates_per_100g: string | null
  proteins_per_100g: string | null
  fat_per_100g: string | null
}

export function dateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function moveDate(date: string, days: number) {
  const value = new Date(`${date}T12:00:00`)
  value.setDate(value.getDate() + days)
  return dateString(value)
}

export function getMealItems(from: string, to = from) {
  return apiRequest<{ data: MealItem[] }>(`meal-items?from=${from}&to=${to}`)
}

export async function addMealItem(food: FoodSearchResult, date: string, meal: MealType, grams: number) {
  const nutrition = food.nutrition_per_100g
  const rounded = (value: number | null) => value === null ? null : Number(value.toFixed(3))
  await initializeCsrf()
  return apiRequest<{ data: MealItem }>('meal-items', {
    method: 'POST',
    body: JSON.stringify({
      date,
      meal_type: meal,
      food_name: food.name?.trim() || 'Prodotto senza nome',
      barcode: food.barcode,
      brand: food.brand,
      quantity_g: grams,
      calories_per_100g: rounded(nutrition.calories),
      carbohydrates_per_100g: rounded(nutrition.carbohydrates),
      proteins_per_100g: rounded(nutrition.proteins),
      fat_per_100g: rounded(nutrition.fat),
    }),
  })
}

export async function updateMealQuantity(id: number, grams: number) {
  await initializeCsrf()
  return apiRequest<{ data: MealItem }>(`meal-items/${id}`, {
    method: 'PATCH', body: JSON.stringify({ quantity_g: grams }),
  })
}

export async function deleteMealItem(id: number) {
  await initializeCsrf()
  return apiRequest<void>(`meal-items/${id}`, { method: 'DELETE' })
}
