import { apiRequest, initializeCsrf } from "./api";
import type { FoodSearchResult } from "./ingredients";
import { italianToday, shiftDate } from "./scheduleDates";

export const meals = [
  { id: "breakfast", title: "Colazione" },
  { id: "morning_snack", title: "Snack mattutino" },
  { id: "lunch", title: "Pranzo" },
  { id: "afternoon_snack", title: "Snack pomeridiano" },
  { id: "dinner", title: "Cena" },
] as const;

export type MealType = (typeof meals)[number]["id"];
export type MealItem = {
  id: number;
  date: string;
  meal_type: MealType;
  food_name: string;
  barcode: string | null;
  brand: string | null;
  quantity_g: number;
  calories_per_100g: number | null;
  carbohydrates_per_100g: number | null;
  proteins_per_100g: number | null;
  fat_per_100g: number | null;
};

type MealItemResponse = Omit<
  MealItem,
  | "quantity_g"
  | "calories_per_100g"
  | "carbohydrates_per_100g"
  | "proteins_per_100g"
  | "fat_per_100g"
> & {
  quantity_g: string | number;
  calories_per_100g: string | number | null;
  carbohydrates_per_100g: string | number | null;
  proteins_per_100g: string | number | null;
  fat_per_100g: string | number | null;
};

function toMealItem(item: MealItemResponse): MealItem {
  const numberOrNull = (value: string | number | null) =>
    value === null ? null : Number(value);
  return {
    ...item,
    quantity_g: Number(item.quantity_g),
    calories_per_100g: numberOrNull(item.calories_per_100g),
    carbohydrates_per_100g: numberOrNull(item.carbohydrates_per_100g),
    proteins_per_100g: numberOrNull(item.proteins_per_100g),
    fat_per_100g: numberOrNull(item.fat_per_100g),
  };
}

export const dateString = italianToday;

export function moveDate(date: string, days: number) {
  return shiftDate(date, days);
}

export function getMealItems(from: string, to = from) {
  return apiRequest<{ data: MealItemResponse[] }>(
    `meal-items?from=${from}&to=${to}`,
  ).then((response) => ({ data: response.data.map(toMealItem) }));
}

export async function addMealItem(
  food: FoodSearchResult,
  date: string,
  meal: MealType,
  grams: number,
) {
  const nutrition = food.nutrition_per_100g;
  const rounded = (value: number | null) =>
    value === null ? null : Number(value.toFixed(3));
  await initializeCsrf();
  const response = await apiRequest<{ data: MealItemResponse }>("meal-items", {
    method: "POST",
    body: JSON.stringify({
      date,
      meal_type: meal,
      food_name: food.name?.trim() || "Prodotto senza nome",
      barcode: food.barcode,
      brand: food.brand,
      quantity_g: grams,
      calories_per_100g: rounded(nutrition.calories),
      carbohydrates_per_100g: rounded(nutrition.carbohydrates),
      proteins_per_100g: rounded(nutrition.proteins),
      fat_per_100g: rounded(nutrition.fat),
    }),
  });
  return { data: toMealItem(response.data) };
}

export async function updateMealQuantity(id: number, grams: number) {
  await initializeCsrf();
  const response = await apiRequest<{ data: MealItemResponse }>(
    `meal-items/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({ quantity_g: grams }),
    },
  );
  return { data: toMealItem(response.data) };
}

export async function deleteMealItem(id: number) {
  await initializeCsrf();
  return apiRequest<void>(`meal-items/${id}`, { method: "DELETE" });
}
