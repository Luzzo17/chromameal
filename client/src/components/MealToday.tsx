import TitlePill from "./TitlePill"

type MealTodayProps = {
    title: string
    menu?: string[]
}

function MealToday ({title, menu = []}: MealTodayProps) {
    return (
        <div className='meal-recap'>
            <TitlePill title={title} />
            <ul>
                {menu.map((item) => (
                    <li key={item}>{item}</li>
                ))}
            </ul>
        </div>
    )
}

export default MealToday