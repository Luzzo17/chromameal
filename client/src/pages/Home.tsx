import '../App.css'
import Section from '../components/Section'
import MealToday from '../components/MealToday'
import Week from '../components/Week'
import ShoppingList from '../components/ShoppingList'
import Profile from '../components/Profile'
import IconLink from '../components/IconLink'

function Home() {
const breakfast = [
  "Pan bauletto 50g",
  "Avocado 20g",
  "Uovo 100g",
]
const snack1 = [
  "Mela 100g",
  "Mandorle 10g",
]
const lunch = [
  "Spaghetti 100g",
  "Passata di pomodoro 200g",
  "Tonno 100g",
  "Pane 60g",
]
const snack2 = [
  "Latte 100g",
  "Proteine in polvere 25g",
]
const dinner = [
  "Crackers 30g",
  "Riso alla cantonese 1 porzione",
]

  return (
    <main>
      <div id='dashboard'>

        <div id='today'>
          <Section title='Il tuo menù del giorno'>
            <div>
            <MealToday title="Colazione" menu={breakfast} />
            <MealToday title='Snack' menu={snack1} />
            <MealToday title="Pranzo" menu={lunch} />
            <MealToday title='Snack' menu={snack2} />
            <MealToday title="Cena" menu={dinner} />
            </div>
          </Section>       
        </div>
        
        
        
        
        <div id='sidebar'>
          <Profile title="Benvenuto {UserName}" />
          <IconLink title='Le tue ricette' href='#' icon='#'/>
          <ShoppingList ingredients={[...breakfast, ...snack1, ...lunch, ...snack2, ...dinner]} />



      </div>
        </div>
      <Section title='La tua settimana' fullWidth>
        <Week
            renderDay={(dayId) => (
                <p>Menu del giorno: {dayId}</p>
            )}
        />
      </Section>
    </main>
    )
}

export default Home
