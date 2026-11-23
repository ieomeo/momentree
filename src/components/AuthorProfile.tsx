import { Link } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';

export function ProfileAvatar({ avatar, size = 24 }: { avatar?: string | null; size?: number }) {
  return avatar ? <img src={avatar} alt="" width={size} height={size} style={{borderRadius: '50%', objectFit: 'cover', flexShrink: 0}} /> : <FaUserCircle size={size} aria-hidden="true" />;
}
export default function AuthorProfile({id, avatar, nickname}: {id: string; avatar?: string; nickname: string}) {
  return id ? <Link to={`/profile/${id}`} aria-label={`${nickname}님의 프로필`} style={{display: 'inline-flex', gap: '0.35rem', alignItems: 'center', textDecoration: 'underline'}}><ProfileAvatar avatar={avatar} />{nickname}</Link> : <span>{nickname}</span>;
}
