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
}

function Week({ renderDay }: WeekProps) {
    return (
        <div className="week">
            {days.map((day) => (
                <div className="week-day" key={day.id}>
                    <TitlePill title={day.title} week />

                    <div className="week-day-content">
                        {renderDay?.(day.id)}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default Week