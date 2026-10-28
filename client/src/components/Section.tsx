import type {ComponentPropsWithoutRef, ReactNode} from 'react'
import IconLink from './IconLink'

type SectionProps = Omit<ComponentPropsWithoutRef<'section'>, 'title' | 'children'> & {
    title: string
    children: ReactNode
    fullWidth?: boolean
    icon?: ReactNode
    href?: string
    contentClassName?: string
}

function Section({title, children, fullWidth = false, icon, href, className, contentClassName, ...props}: SectionProps) {
    return (
        <section className={className} {...props}>
            <IconLink title={title} icon={icon} href={href} sectionHeader />

            <div className={`section-content bg-white${fullWidth ? ' section-content--full-width' : ''}${contentClassName ? ` ${contentClassName}` : ''}`}>
                {children}
            </div>
        </section>
    )
}

export default Section
