import TitlePill from "./TitlePill"

type MealTodayProps = {
    title: string
    menu?: string[]
}

function MealToday ({title, menu = []}: MealTodayProps) {
    return (
        <div className='meal-recap'>
            <TitlePill title={title} />
                {menu.length === 0 ? (
                    <p>Nessun alimento pianificato.</p>
                    ) : (
                    <ul>
                        {menu.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                        ))}
                    </ul>
                )}
        </div>
    )
}

export default MealToday