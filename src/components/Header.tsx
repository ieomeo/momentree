import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import styled from '@emotion/styled';
import Logo from './Logo';
import LeafIcon from './LeafIcon';
import NotificationBell from './NotificationBell';
import { Button } from './ui';
import { authAPI } from '../services/api';
import { color } from '../styles/theme';
import type { User } from '../types';

const Bar = styled.header`
  background: white;
  border-bottom: 1.5px solid ${color.border};
`;

const Inner = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 0.5rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
`;

const Nav = styled.nav`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 1.4rem;
  flex-wrap: wrap;
`;

const Item = styled(NavLink)`
  padding: 0.2rem 0;
  border-bottom: 2px solid transparent;
  &.active { font-weight: 800; border-bottom-color: ${color.green}; }
`;

// [추가] 누르면 나의 정원의 '나뭇잎' 탭으로 이동
const Leaves = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.8rem;
  border-radius: 999px;
  background: ${color.greenSoft};
  font-weight: 800;
  &:hover { filter: brightness(0.96); }
`;

export default function Header({ me }: { me: User }) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const logout = async () => {
    await authAPI.logout();
    qc.clear();
    qc.setQueryData(['me'], null);
    navigate('/');
  };

  return (
    <Bar>
      <Inner>
        <Logo to="/feed" height={44} />
        <Nav>
          <Item to="/feed">서재</Item>
          <Item to="/write">글쓰기</Item>
          <Item to="/me">나의 정원</Item>
          {me.role === 'admin' && <Item to="/admin">운영자</Item>}
          {/* [추가] 알림 종: 새 알림이 있으면 빨간 점 */}
          <NotificationBell />
          <Leaves to="/me?tab=leaves" title="나의 정원에서 나뭇잎 보기">
            <LeafIcon size={20} /> {me.leaves}
          </Leaves>
          <Button $variant="sand" onClick={logout}>로그아웃</Button>
        </Nav>
      </Inner>
    </Bar>
  );
}
