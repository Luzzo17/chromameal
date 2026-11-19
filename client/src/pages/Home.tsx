import { useOutletContext } from "react-router";
import Section from "../components/Section";
import MealToday from "../components/MealToday";
import Week from "../components/Week";
import ShoppingList from "../components/ShoppingList";
import Profile from "../components/Profile";
import { useApiResource } from "../hooks/useApiResource";
import { getMealItems, meals } from "../lib/meals";
import type { User } from "../lib/auth";
import {
  currentMonday,
  italianToday,
  shiftDate,
  weekDays,
} from "../lib/scheduleDates";
import MealIcon from "../components/icons/MealIcon";
import PlannerIcon from "../components/icons/PlannerIcon";

function Home() {
  const user = useOutletContext<User>();
  const today = italianToday();
  const weekStart = currentMonday();
  const weekEnd = shiftDate(weekStart, 6);
  const { data: items, error } = useApiResource(
    async () => (await getMealItems(weekStart, weekEnd)).data,
    [weekStart, weekEnd],
    "i pasti",
  );

  const displayedDays = weekDays(weekStart);

  return (
    <main>
      <div id="dashboard">
        <div id="home-profile">
          <Profile title={`Benvenuto ${user.name}`} />
        </div>

        <div className="home-today">
          <Section
            title="Il tuo menù del giorno"
            href="/planner"
            icon={<MealIcon />}
          >
            <div>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}

              {items === null && !error && (
                <p role="status">Caricamento pasti…</p>
              )}

              {items !== null &&
                !error &&
                meals.map((meal) => {
                  const menu = items
                    .filter(
                      (item) =>
                        item.date === today && item.meal_type === meal.id,
                    )
                    .map(
                      (item) =>
                        `${item.food_name} ${item.quantity_g.toLocaleString("it-IT")} g`,
                    );

                  return (
                    <MealToday key={meal.id} title={meal.title} menu={menu} />
                  );
                })}
            </div>
          </Section>
        </div>

        <div id="sidebar">
          <ShoppingList />
        </div>
      </div>

      <Section
        title="La tua settimana"
        fullWidth
        href="/planner"
        icon={<PlannerIcon />}
      >
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
              days={displayedDays}
              renderDay={(date) => {
                const dayItems = items.filter((item) => item.date === date);

                if (dayItems.length === 0) {
                  return <p>Nessun pasto pianificato.</p>;
                }

                return (
                  <div className="home-week-meals">
                    {meals.map((meal) => {
                      const mealItems = dayItems.filter(
                        (item) => item.meal_type === meal.id,
                      );

                      if (mealItems.length === 0) return null;

                      return (
                        <div key={meal.id}>
                          <h4>{meal.title}</h4>
                          <ul>
                            {mealItems.map((item) => (
                              <li key={item.id}>
                                {item.food_name}{" "}
                                <strong>
                                  {item.quantity_g.toLocaleString("it-IT")} g
                                </strong>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                );
              }}
            />
          </div>
        )}
      </Section>
    </main>
  );
}

export default Home;
