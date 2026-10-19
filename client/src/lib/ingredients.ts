import {apiRequest} from './api'

export type FoodSearchResult = {
    barcode: string | null
    name: string | null
    brand: string | null
    nutrition_per_100g:{
        calories: number | null
        carbohydrates: number | null
        protein: number | null
        fat: number | null
    }
}

export type IngredientInput = {
  name: string
  brand?: string | null
  barcode?: string | null
  source: 'open_food_facts' | 'manual'
  calories: number
  carbohydrates: number
  proteins: number
  fat: number
}

export type Ingredient = Omit<IngredientInput, 'calories' | 'carbohydrates' | 'proteins' | 'fat'>
& {
    id: number
    user_id: number
    calories: string
    carbohydrates: string
    protein: string
    fat: string
    created_at: string
    updated_at: string
}

export type IngredientPage = {
    data: Ingredient[]
    current_page: number
    last_page: number
    total: number
}

export function searchFoods(query: string) {
    return apiRequest<{ data: FoodSearchResult[] }>(
        `foods/search?query=${encodeURIComponent(query.trim())}`,
    )
}

export function getIngredients(page = 1) {
    return apiRequest<IngredientPage>(
        `ingredients?page=${page}`,
    )
}

export function saveIngredient(ingredient: IngredientInput) {
    return apiRequest<{ data: Ingredient }>('ingredients', {
        method: 'POST',
        body: JSON.stringify(ingredient),
    })
}