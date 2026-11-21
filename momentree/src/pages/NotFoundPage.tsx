import { Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { Button } from '../components/ui';

const Wrap = styled.div`
  text-align: center;
  padding: 5rem 1rem;
  h1 { margin-bottom: 0.5rem; }
  p { margin-bottom: 1.5rem; }
`;

export default function NotFoundPage() {
  return (
    <Wrap>
      <h1>페이지를 찾을 수 없어요</h1>
      <p>주소를 다시 확인하거나 처음 화면으로 돌아가 주세요.</p>
      <Link to="/"><Button>처음으로</Button></Link>
    </Wrap>
  );
}
