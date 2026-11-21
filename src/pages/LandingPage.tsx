import { Link, Navigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { Button } from '../components/ui';
import { useMe } from '../hooks/useMe';
import { color } from '../styles/theme';

const Page = styled.div`
  min-height: 100vh;
  background: ${color.paper};
  display: flex;
  flex-direction: column;
`;

const Top = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1.2rem;
  padding: 1rem 1.5rem;
`;

const Hero = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0 1rem 2rem;
  text-align: center;

  img {
    width: auto;
    max-width: 100%;
    height: min(62vh, 560px);
    object-fit: contain;
  }
  p.sub { font-size: 1.2rem; }
  p.en { color: ${color.brownSoft}; }
`;

export default function LandingPage() {
  const { data: me } = useMe();
  if (me) return <Navigate to="/feed" replace />;

  return (
    <Page>
      <Top>
        <Link to="/login">로그인</Link>
        <Link to="/signup"><Button>가입하기</Button></Link>
      </Top>
      <Hero>
        <img src="/logo-tree.webp" alt="모먼트리 - 황금빛 나무와 새싹" />
        <p className="sub">마음의 조각들이 모여 따뜻한 숲이 되는 공간</p>
        <p className="en">Pause. Write. Be Heard.</p>
      </Hero>
    </Page>
  );
}
