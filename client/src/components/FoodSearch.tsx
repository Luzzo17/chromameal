import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError } from '../lib/api'
import { searchFoods } from '../lib/ingredients'
import type { FoodSearchResult } from '../lib/ingredients'

type FoodSearchProps = {
    onSelect: (food: FoodSearchResult) => void
}

export default function FoodSearch({ onSelect }: FoodSearchProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<FoodSearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [searched, setSearched] = useState(false)
    const [error, setError] = useState('')

    async function handleSearch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const term = query.trim()

        if(term.length < 2 || loading) return

        setLoading(true)
        setError('')
        setResults([])
        setSearched(false)

        try {
            const response = await searchFoods(term)
            setResults(response.data)
            setSearched(true)
        } catch (reason) {
            if (reason instanceof ApiError && reason.status === 429) {
                setError('Troppe richieste. Riprova più tardi.')
            } else if (reason instanceof ApiError && reason.status === 503) {
                setError(reason.message)
            } else {
                setError('Ricerca non disponibile. Riprova più tardi.')
            }
        } finally {
            setLoading(false)
        }
        }
        return (
            <section aria-labelledby="food-search-title">
                <h2 id="food-search-title">Cerca un alimento</h2>

                <form onSubmit={handleSearch}>
                    <label htmlFor="food-query">Nome dell'alimento</label>

                    <input className="bg-white"
                        id="food-query"
                        type="search"
                        placeholder="es. Spaghetti"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        minLength={2}
                        maxLength={100}
                        required
                        disabled={loading}
                    />
                    <button className="action-button bg-secondary"
                        type="submit"
                        disabled={loading || query.trim().length < 2}
                        >
                        {loading ? 'Ricerca in corso…' : 'Cerca'}
                    </button>
                </form>
            {error && <p className="form-error" role="alert">{error}</p>}

      {searched && results.length === 0 && (
        <p role="status">Nessun alimento trovato.</p>
      )}

      <ul aria-label="Risultati della ricerca" aria-busy={loading}>
        {results.map((food, index) => (
          <li className="bg-white" key={`${food.barcode ?? 'food'}-${index}`}>
            <strong>{food.name || 'Prodotto senza nome'}</strong>

            {food.brand && <p>{food.brand}</p>}

            <p>
              Calorie per 100 g:{' '}
              {food.nutrition_per_100g.calories === null
                ? 'dato mancante'
                : `${food.nutrition_per_100g.calories.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kcal`}
            </p>

            <button className="action-button bg-secondary" type="button" onClick={() => onSelect(food)}>
              Seleziona
            </button>
          </li>
        ))}
      </ul>

      <p>
        Dati da{' '}
        <a href="https://world.openfoodfacts.org/">
          Open Food Facts
        </a>
        .
      </p>
            </section>
        )
    }
