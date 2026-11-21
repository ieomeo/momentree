import { Global, css } from '@emotion/react';
import { color } from './theme';

export default function GlobalStyles() {
  return (
    <Global
      styles={css`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: ${color.bg};
          color: ${color.brown};
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo',
            'Malgun Gothic', 'Noto Sans KR', sans-serif;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
        }
        a { color: inherit; text-decoration: none; }
        ul { list-style: none; }
        button, input, select, textarea { font: inherit; color: inherit; }
        :focus-visible { outline: 2px solid ${color.brown}; outline-offset: 2px; }
      `}
    />
  );
}
