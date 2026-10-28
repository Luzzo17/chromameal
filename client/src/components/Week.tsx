import type { ReactNode } from "react"
import TitlePill from "./TitlePill"

const days = [
    { id: "monday", title: "Lunedì" },
    { id: "tuesday", title: "Martedì" },
    { id: "wednesday", title: "Mercoledì" },
    { id: "thursday", title: "Giovedì" },
    { id: "friday", title: "Venerdì" },
    { id: "saturday", title: "Sabato" },
    { id: "sunday", title: "Domenica" },
]

type WeekProps = {
    renderDay?: (dayId: string) => ReactNode
    days?: { id: string; title: string; dateLabel?: string }[]
}

function Week({ renderDay, days: displayedDays = days }: WeekProps) {
    return (
        <div className="week">
            {displayedDays.map((day, index) => (
                <div className={`week-day${index % 2 === 1 ? ' bg-secondary-soft' : ''}`} key={day.id}>
                    <div className="week-day-heading">
                        <TitlePill title={day.title} week />
                        {day.dateLabel && <p className="week-date">{day.dateLabel}</p>}
                    </div>

                    <div className="week-day-content">
                        {renderDay?.(day.id)}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default Week
