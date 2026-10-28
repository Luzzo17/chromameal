import type {ReactNode} from 'react'
import { Link } from 'react-router'

type IconLinkProps = {
    title: string
    icon?: ReactNode
    href?: string
    sectionHeader?: boolean
}

function IconLink({title, icon, href, sectionHeader = false}: IconLinkProps) {
    const isHeader = sectionHeader || !href
    const className = isHeader
        ? 'section-header bg-secondary shadow'
        : 'button-style bg-secondary'

    const content = (
        <>
            {icon && (
                <span className="icon-link-icon" aria-hidden="true">
                    {icon}
                </span>
            )}
            {isHeader ? <h1>{title}</h1> : <span className="icon-link-title">{title}</span>}
        </>
    )

    if (!href) {
        return (
            <header className={className}>
                {content}
            </header>
        )
    }

    if (href.startsWith('/') && !href.startsWith('//')) {
        return (
            <Link className={className} to={href}>
                {content}
            </Link>
        )
    }

    return (
        <a className={className} href={href}>
            {content}
        </a>
    )
}

export default IconLink
