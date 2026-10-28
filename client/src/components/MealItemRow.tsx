import { useState } from 'react'
import type { FormEvent } from 'react'
import type { MealItem } from '../lib/meals'

type Props = {
  item: MealItem
  busy: boolean
  onUpdate: (id: number, grams: number) => Promise<boolean>
  onDelete: (id: number) => Promise<void>
}

export default function MealItemRow({ item, busy, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const calories = item.calories_per_100g === null
    ? null : Number(item.calories_per_100g) * Number(item.quantity_g) / 100

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const grams = Number(new FormData(event.currentTarget).get('grams'))
    if (await onUpdate(item.id, grams)) setEditing(false)
  }

  return (
    <li className="meal-item bg-secondary-soft">
      <strong>{item.food_name}</strong>
      {item.brand && <span>{item.brand}</span>}
      <p>{Number(item.quantity_g).toLocaleString('it-IT')} g · {calories === null
        ? 'Calorie non disponibili'
        : `${calories.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kcal`}</p>
      {editing ? (
        <form onSubmit={save}>
          <fieldset disabled={busy}>
            <label>Quantità (g)
              <input className="bg-white" name="grams" type="number" min="0.01" max="10000" step="0.01" defaultValue={item.quantity_g} required />
            </label>
            <div className="meal-item-actions">
              <button className="action-button bg-secondary" type="submit">Salva</button>
              <button className="action-button bg-secondary" type="button" onClick={() => setEditing(false)}>Annulla</button>
            </div>
          </fieldset>
        </form>
      ) : (
        <div className="meal-item-actions">
          <button className="action-button bg-secondary" disabled={busy} type="button" onClick={() => setEditing(true)} aria-label={`Modifica quantità di ${item.food_name}`}>Modifica</button>
          <button className="action-button bg-secondary" disabled={busy} type="button" onClick={() => void onDelete(item.id)} aria-label={`Elimina ${item.food_name} dal pasto`}>Elimina</button>
        </div>
      )}
    </li>
  )
}
