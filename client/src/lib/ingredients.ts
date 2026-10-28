import { apiRequest } from './api'

export type FoodSearchResult = {
    barcode: string | null
    name: string | null
    brand: string | null
    nutrition_per_100g: {
        calories: number | null
        carbohydrates: number | null
        proteins: number | null
        fat: number | null
    }
}

export function searchFoods(query: string) {
    return apiRequest<{ data: FoodSearchResult[] }>(
        `foods/search?query=${encodeURIComponent(query.trim())}`,
    )
}

