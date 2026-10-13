import type {ReactNode} from 'react'

type SelectionProps = {
    title: string
    children: ReactNode
    fullWidth?: boolean
}

function Section({title, children, fullWidth = false}: SelectionProps) {
    return (
        <section>
            <header className='section-header shadow'>
                <h1>{title}</h1>
            </header>

            <div className={`section-content${fullWidth ? ' section-content--full-width' : ''}`}>
                {children}
            </div>
        </section>
    )
}

export default Section
