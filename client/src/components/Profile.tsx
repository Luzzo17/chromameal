import ProfileIcon from './icons/ProfileIcon'
import { Link } from 'react-router'

type ProfileProps = {
    title: string
}

function Profile ({title}: ProfileProps) {
    return (
        <div className='profile bg-secondary'>
            <ProfileIcon className="profile-icon" />
            <h2>{title}</h2>
            <Link to="/account">Il tuo account</Link>
        </div>
    )
}

export default Profile
