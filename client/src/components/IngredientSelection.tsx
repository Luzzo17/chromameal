import type { FormEvent } from "react";
import type { FoodSearchResult } from "../lib/ingredients";
import { meals } from "../lib/meals";
import type { MealType } from "../lib/meals";

type Props = {
  food: FoodSearchResult;
  dayTitle: string;
  meal: MealType;
  busy: boolean;
  onCancel: () => void;
  onAdd: (meal: MealType, grams: number) => Promise<void>;
};

export default function IngredientSelection({
  food,
  dayTitle,
  meal,
  busy,
  onCancel,
  onAdd,
}: Props) {
  function isMealType(value: FormDataEntryValue | null): value is MealType {
    return typeof value === "string" && meals.some((item) => item.id === value);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const selectedMeal = data.get("meal");
    const grams = Number(data.get("grams"));
    if (
      !isMealType(selectedMeal) ||
      !Number.isFinite(grams) ||
      grams <= 0 ||
      grams > 10000
    )
      return;
    void onAdd(selectedMeal, grams);
  }

  const nutrients = [
    ["Calorie (kcal)", food.nutrition_per_100g.calories],
    ["Carboidrati (g)", food.nutrition_per_100g.carbohydrates],
    ["Proteine (g)", food.nutrition_per_100g.proteins],
    ["Grassi (g)", food.nutrition_per_100g.fat],
  ] as const;

  return (
    <form className="ingredient-selection" onSubmit={submit}>
      <h2>{food.name || "Prodotto senza nome"}</h2>
      {food.brand && <p>{food.brand}</p>}
      <p>
        Giorno: <strong>{dayTitle}</strong>
      </p>
      <p>Valori per 100 g da Open Food Facts</p>
      <dl className="meal-nutrients">
        {nutrients.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              {value === null
                ? "Non disponibile"
                : value.toLocaleString("it-IT", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
            </dd>
          </div>
        ))}
      </dl>
      <fieldset disabled={busy}>
        <label>
          Pasto
          <select className="bg-white" name="meal" defaultValue={meal}>
            {meals.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Quantità da mangiare (g)
          <input
            className="bg-white"
            name="grams"
            type="number"
            min="0.01"
            max="10000"
            step="0.01"
            defaultValue="100"
            required
          />
        </label>
        <button className="action-button bg-secondary" type="submit">
          {busy ? "Salvataggio…" : "Aggiungi al pasto"}
        </button>
        <button
          className="action-button bg-secondary"
          type="button"
          onClick={onCancel}
        >
          Annulla
        </button>
      </fieldset>
      <p>Il pasto viene salvato subito nel tuo account.</p>
    </form>
  );
}
