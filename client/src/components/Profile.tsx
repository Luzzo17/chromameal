import ProfileIcon from './icons/ProfileIcon'

type ProfileProps = {
    title: string
}

function Profile ({title}: ProfileProps) {
    return (
        <div className='profile bg-secondary'>
            <ProfileIcon className="profile-icon" />
            <h2>{title}</h2>
        </div>
    )
}

export default Profile
