import { useState } from 'react'
import './App.css'
import Section from './components/Section'

function App() {
  const [count, setCount] = useState(0)

  return (
    <main>
      <div id='dashboard'>

        <div id='today'>
          <Section title='Il tuo menù del giorno'>
            <p></p>
          </Section>
        </div>
        <div id='sidebar'>
          <Section title='La tua spesa'>
            <ul></ul>
          </Section>

        </div>

      </div>

    </main>
    )
}

export default App
