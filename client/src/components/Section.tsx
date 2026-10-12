import type {ReactNode} from 'react'

type SelectionProps = {
    title: string
    children: ReactNode
}

function Section({title, children}: SelectionProps) {
    return (
        <section>
            <header className='section-header shadow'>
                <h1>{title}</h1>
            </header>

            <div className='section-content'>
                {children}
            </div>
        </section>
    )
}

export default Section