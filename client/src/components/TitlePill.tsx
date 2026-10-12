type TitlePillProps = {
    title: string
    week?: boolean
}

function TitlePill ({title, week = false}: TitlePillProps) {
    return (
        <div className={`bg-secondary shadow title-pill ${week ? 'title-pill--week' : ''}`}>
          <h2>{title}</h2>
        </div>
    )
}

export default TitlePill