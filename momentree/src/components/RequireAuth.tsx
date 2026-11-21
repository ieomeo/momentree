import { Navigate, Outlet } from 'react-router-dom';
import styled from '@emotion/styled';
import Header from './Header';
import { useMe } from '../hooks/useMe';
import { restrictionLabel } from '../services/format';
import { color } from '../styles/theme';

const Main = styled.main`
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.5rem;
`;

// [추가] 이용 제한 중일 때 화면 맨 위에 보이는 안내
const Banner = styled.div`
  background: #fbe9e4;
  border-bottom: 1.5px solid ${color.danger};
  padding: 0.7rem 1.5rem;
  text-align: center;
  font-size: 0.9rem;
`;

// 로그인한 사용자만 통과. admin이면 운영자만 통과.
export default function RequireAuth({ admin = false }: { admin?: boolean }) {
  const { data: me, isLoading } = useMe();
  if (isLoading) return null;
  if (!me) return <Navigate to="/login" replace />;
  if (admin && me.role !== 'admin') return <Navigate to="/feed" replace />;
  return (
    <>
      <Header me={me} />
      {me.restrictedUntil && (
        <Banner role="status">
          <strong>이용 제한 중이에요 ({restrictionLabel(me.restrictedUntil)}).</strong> 글쓰기·댓글·공감·구독을 할 수 없어요.
          {me.restrictionReason ? ` 사유: ${me.restrictionReason}` : ''}
        </Banner>
      )}
      <Main>
        <Outlet />
      </Main>
    </>
  );
}
