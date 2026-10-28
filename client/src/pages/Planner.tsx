import { useState } from 'react'
import { Link } from 'react-router'
import Section from '../components/Section'
import MealPlanner from '../components/MealPlanner'
import SchedulePlanner from '../components/SchedulePlanner'
import './Planner.css'
import PlannerIcon from '../components/icons/PlannerIcon'

export default function Planner() {
    const [mode, setMode] = useState<'schedule' | 'meals'>('schedule')

    return (
        <main className="planner-page">
            <Link to="/">Torna alla home</Link>
            <Section title="Planner settimanale" icon={<PlannerIcon />} fullWidth>
                <p className="planner-intro">
                    Organizza i tuoi pasti e imposta turni e impegni. Ogni operazione
                    viene salvata nel tuo account, per ritrovare il piano al prossimo accesso.
                </p>
                <div className="planner-tabs" aria-label="Modalità del planner">
                    <button type="button" aria-pressed={mode === 'schedule'} onClick={() => setMode('schedule')}>Imposta turni e impegni</button>
                    <button type="button" aria-pressed={mode === 'meals'} onClick={() => setMode('meals')}>Programma i pasti</button>
                </div>
                {mode === 'meals' ? <MealPlanner /> : <SchedulePlanner />}
            </Section>
        </main>
    )
}
