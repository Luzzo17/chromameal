import type {ReactNode} from 'react'

type IconLinkProps = {
    title: string
    icon?: ReactNode
    href: string
}

function IconLink ({title, icon, href}: IconLinkProps) {
    return (
        <a className='button-style bg-secondary' href={href}>
            {icon && <span aria-hidden="true">{icon}</span>}
            <span className="icon-link-title">{title}</span>
        </a>
    )
}

export default IconLink
