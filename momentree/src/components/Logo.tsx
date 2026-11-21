import { Link } from 'react-router-dom';
import styled from '@emotion/styled';

const Img = styled.img<{ $height: number }>`
  display: block;
  height: ${({ $height }) => $height}px;
  width: auto;
`;

interface LogoProps {
  to?: string;
  height?: number;
}

// 가로형 로고(상징 + 워드마크). 이미지는 public/logo-horizontal.png
export default function Logo({ to = '/', height = 40 }: LogoProps) {
  return (
    <Link to={to} aria-label="모먼트리 홈" style={{ display: 'inline-block' }}>
      <Img src="/logo-horizontal.png" alt="모먼트리" $height={height} />
    </Link>
  );
}
