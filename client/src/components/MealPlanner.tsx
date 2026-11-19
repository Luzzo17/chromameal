import { useRef, useState } from "react";
import { Link } from "react-router";
import FoodSearch from "./FoodSearch";
import IngredientSelection from "./IngredientSelection";
import MealItemRow from "./MealItemRow";
import TitlePill from "./TitlePill";
import { ApiError } from "../lib/api";
import { useApiResource } from "../hooks/useApiResource";
import { italianDayTitle } from "../lib/scheduleDates";
import type { FoodSearchResult } from "../lib/ingredients";
import {
  addMealItem,
  dateString,
  deleteMealItem,
  getMealItems,
  meals,
  moveDate,
  updateMealQuantity,
} from "../lib/meals";
import type { MealType } from "../lib/meals";

export default function MealPlanner() {
  const [date, setDate] = useState(dateString);
  return <MealDay key={date} date={date} onDateChange={setDate} />;
}

function MealDay({
  date,
  onDateChange,
}: {
  date: string;
  onDateChange: (value: string) => void;
}) {
  const {
    data: items,
    setData: setItems,
    error,
    setError,
    needsLogin,
    setNeedsLogin,
    reload,
  } = useApiResource(
    async () => (await getMealItems(date)).data,
    [date],
    "i pasti",
  );
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(
    null,
  );
  const [meal, setMeal] = useState<MealType>("breakfast");
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const searchPanel = useRef<HTMLElement>(null);
  const dayTitle = italianDayTitle(date);

  function showError(reason: unknown) {
    setConfirmation("");
    if (
      reason instanceof ApiError &&
      (reason.status === 401 || reason.status === 419)
    ) {
      setNeedsLogin(true);
      setItems(null);
      setSelectedFood(null);
      setError("La sessione è scaduta. Accedi di nuovo al tuo account.");
    } else if (reason instanceof ApiError && reason.status === 422) {
      setError(Object.values(reason.errors).flat().join(" ") || reason.message);
    } else {
      setError(
        "Operazione non riuscita. Ricarica i pasti per verificarne lo stato prima di riprovare.",
      );
    }
  }

  async function add(type: MealType, grams: number) {
    if (!selectedFood || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await addMealItem(selectedFood, date, type, grams);
      setItems((previous) => [...(previous ?? []), response.data]);
      setSelectedFood(null);
      setConfirmation("Alimento aggiunto al pasto e salvato nel tuo account.");
    } catch (reason) {
      showError(reason);
    } finally {
      setBusy(false);
    }
  }

  async function update(id: number, grams: number) {
    if (busy) return false;
    setBusy(true);
    setError("");
    try {
      const response = await updateMealQuantity(id, grams);
      setItems(
        (previous) =>
          previous?.map((item) => (item.id === id ? response.data : item)) ??
          [],
      );
      setConfirmation("Quantità aggiornata e salvata.");
      return true;
    } catch (reason) {
      showError(reason);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await deleteMealItem(id);
      setItems((previous) => previous?.filter((item) => item.id !== id) ?? []);
      setConfirmation("Alimento rimosso dal pasto.");
    } catch (reason) {
      showError(reason);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="meal-planner" aria-busy={busy}>
      <nav className="meal-planner-days" aria-label="Data del planner">
        <button
          className="action-button bg-secondary"
          disabled={busy}
          type="button"
          aria-label="Giorno precedente"
          onClick={() => onDateChange(moveDate(date, -1))}
        >
          ←
        </button>
        <label>
          Giorno
          <input
            className="bg-white"
            type="date"
            value={date}
            disabled={busy}
            required
            min="1900-01-01"
            max="9999-12-31"
            onChange={(event) => {
              if (event.target.validity.valid && event.target.value)
                onDateChange(event.target.value);
            }}
          />
        </label>
        <button
          className="action-button bg-secondary"
          disabled={busy}
          type="button"
          aria-label="Giorno successivo"
          onClick={() => onDateChange(moveDate(date, 1))}
        >
          →
        </button>
        <button
          className="action-button bg-secondary"
          disabled={busy}
          type="button"
          onClick={() => onDateChange(dateString())}
        >
          Oggi
        </button>
      </nav>
      <p className="meal-planner-date" aria-live="polite">
        {dayTitle}
      </p>
      {error && (
        <div className="meal-planner-feedback">
          <p className="form-error" role="alert">
            {error}
          </p>
          {needsLogin ? (
            <Link to="/account">Vai al tuo account</Link>
          ) : (
            <button
              className="action-button bg-secondary"
              disabled={busy}
              onClick={reload}
            >
              Ricarica i pasti
            </button>
          )}
        </div>
      )}
      {confirmation && (
        <p className="meal-planner-feedback" role="status">
          {confirmation}
        </p>
      )}
      {items === null && !error && (
        <p className="meal-planner-feedback" role="status">
          Caricamento pasti…
        </p>
      )}
      {items !== null && !needsLogin && (
        <div className="meal-planner-columns">
          <div className="meal-planner-menu">
            {meals.map((type) => {
              const entries = items.filter(
                (item) => item.meal_type === type.id,
              );
              return (
                <div className="meal-planner-meal" key={type.id}>
                  <TitlePill title={type.title} />
                  {entries.length === 0 ? (
                    <p>Nessun alimento pianificato.</p>
                  ) : (
                    <ul className="meal-items">
                      {entries.map((item) => (
                        <MealItemRow
                          key={item.id}
                          item={item}
                          busy={busy}
                          onUpdate={update}
                          onDelete={remove}
                        />
                      ))}
                    </ul>
                  )}
                  <button
                    className="action-button bg-secondary"
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setMeal(type.id);
                      setSelectedFood(null);
                      setConfirmation("");
                      searchPanel.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                  >
                    Aggiungi alimento a {type.title.toLowerCase()}
                  </button>
                </div>
              );
            })}
          </div>
          <aside
            ref={searchPanel}
            className="meal-planner-search bg-secondary-soft"
            aria-label="Ricerca alimenti"
          >
            {selectedFood ? (
              <IngredientSelection
                food={selectedFood}
                dayTitle={dayTitle}
                meal={meal}
                busy={busy}
                onCancel={() => setSelectedFood(null)}
                onAdd={add}
              />
            ) : (
              <>
                <p className="meal-planner-target">
                  Pasto selezionato:{" "}
                  <strong>
                    {meals.find((type) => type.id === meal)?.title}
                  </strong>
                </p>
                <FoodSearch
                  onSelect={(food) => {
                    setConfirmation("");
                    setSelectedFood(food);
                  }}
                />
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
