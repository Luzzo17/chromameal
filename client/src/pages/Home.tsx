import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router'
import Section from '../components/Section'
import MealToday from '../components/MealToday'
import Week from '../components/Week'
import ShoppingList from '../components/ShoppingList'
import Profile from '../components/Profile'
import { ApiError } from '../lib/api'
import { getMealItems, meals } from '../lib/meals'
import type { MealItem } from '../lib/meals'
import type { User } from '../lib/auth'
import { currentMonday, italianDateTime, shiftDate } from '../lib/scheduleDates'
import MealIcon from '../components/icons/MealIcon'
import PlannerIcon from '../components/icons/PlannerIcon'
// import IconLink from '../components/IconLink'

function Home() {
    const user = useOutletContext<User>()
    const [items, setItems] = useState<MealItem[] | null>(null)
    const [error, setError] = useState('')

    const today = italianDateTime(new Date()).slice(0, 10)
    const weekStart = currentMonday()
    const weekEnd = shiftDate(weekStart, 6)
    const dayNames = [
        'Lunedì',
        'Martedì',
        'Mercoledì',
        'Giovedì',
        'Venerdì',
        'Sabato',
        'Domenica',
    ]

    const weekDays = dayNames.map((title, index) => {
        const date = shiftDate(weekStart, index)

        return {
            id: date,
            title,
            dateLabel: new Date(`${date}T12:00:00Z`).toLocaleDateString('it-IT', {
                timeZone: 'UTC',
                day: 'numeric',
                month: 'short',
            }),
        }
    })

    useEffect(() => {
        let active = true

        async function loadMeals() {
            try {
                const response = await getMealItems(weekStart, weekEnd)

                if (active) {
                    setItems(response.data)
                    setError('')
                }
            } catch (reason) {
                if (!active) return

                if (reason instanceof ApiError && reason.status === 401) {
                    setError('Per caricare i pasti serve una sessione attiva.')
                } else {
                    setError('Impossibile caricare i pasti. Ricarica la pagina per riprovare.')
                }
            }
        }

        loadMeals()

        return () => {
            active = false
        }
    }, [weekStart, weekEnd])

    return (
        <main>
            <div id="dashboard">
                <div id="home-profile">
                    <Profile title={`Benvenuto ${user.name}`} />
                </div>

                <div id="today">
                    <Section title="Il tuo menù del giorno" href="/planner" icon={<MealIcon />}>
                        <div>
                            {error && (
                                <p className="form-error" role="alert">
                                    {error}
                                </p>
                            )}

                            {items === null && !error && (
                                <p role="status">Caricamento pasti…</p>
                            )}

                            {items !== null && !error && meals.map((meal) => {
                                const menu = items
                                    .filter((item) => (
                                        item.date === today && item.meal_type === meal.id
                                    ))
                                    .map((item) => (
                                        `${item.food_name} ${Number(item.quantity_g).toLocaleString('it-IT')} g`
                                    ))

                                return (
                                    <MealToday
                                        key={meal.id}
                                        title={meal.title}
                                        menu={menu}
                                    />
                                )
                            })}
                        </div>
                    </Section>
                </div>

                <div id="sidebar">
                    {/* <IconLink title="Le tue ricette" href="#" /> */}
                    <ShoppingList />
                </div>
            </div>

            <Section title="La tua settimana" fullWidth href="/planner" icon={<PlannerIcon/>}>
                {error && (
                    <p className="home-week-feedback form-error" role="alert">
                        {error}
                    </p>
                )}

                {items === null && !error && (
                    <p className="home-week-feedback" role="status">
                        Caricamento settimana…
                    </p>
                )}

                {items !== null && !error && (
                    <div className="home-week-summary">
                        <Week
                            days={weekDays}
                            renderDay={(date) => {
                                const dayItems = items.filter((item) => item.date === date)

                                if (dayItems.length === 0) {
                                    return <p>Nessun pasto pianificato.</p>
                                }

                                return (
                                    <div className="home-week-meals">
                                        {meals.map((meal) => {
                                            const mealItems = dayItems.filter(
                                                (item) => item.meal_type === meal.id
                                            )

                                            if (mealItems.length === 0) return null

                                            return (
                                                <div key={meal.id}>
                                                    <h4>{meal.title}</h4>
                                                    <ul>
                                                        {mealItems.map((item) => (
                                                            <li key={item.id}>
                                                                {item.food_name}{' '}
                                                                <strong>
                                                                    {Number(item.quantity_g).toLocaleString('it-IT')} g
                                                                </strong>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )
                            }}
                        />
                    </div>
                )}
            </Section>
        </main>
    )
}

export default Home
