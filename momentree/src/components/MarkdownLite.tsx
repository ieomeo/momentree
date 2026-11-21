import type { ReactNode } from 'react';
import styled from '@emotion/styled';
import { color } from '../styles/theme';

// 약관 같은 긴 문서를 보여주기 위한 아주 작은 마크다운 렌더러.
// 지원: # ## ### 제목, **굵게**, 1. 번호 목록, - / * 글머리, - [ ] 체크 항목, --- 구분선, 일반 문단
const Doc = styled.div`
  line-height: 1.75;
  font-size: 0.95rem;
  h1 { font-size: 1.35rem; margin: 0.2rem 0 1rem; }
  h2 { font-size: 1.12rem; margin: 1.7rem 0 0.5rem; padding-top: 0.9rem; border-top: 1px solid ${color.border}; }
  h3 { font-size: 1rem; margin: 1.2rem 0 0.35rem; }
  p { margin: 0.4rem 0; }
  ol { list-style: decimal; margin: 0.4rem 0 0.6rem 1.4rem; }
  ul { list-style: disc; margin: 0.4rem 0 0.6rem 1.3rem; }
  ul.check { list-style: none; margin-left: 0.2rem; }
  li { margin: 0.2rem 0; }
  hr { border: none; border-top: 1px solid ${color.border}; margin: 1.4rem 0; }
`;

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.length > 4 && part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
  );
}

const isOrdered = (line: string) => /^\d+\.\s/.test(line);
const isBullet = (line: string) => /^[-*]\s/.test(line);

export default function MarkdownLite({ text }: { text: string }) {
  const lines = text.split('\n').map((l) => l.trimEnd());
  const out: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') {
      i += 1;
    } else if (line.startsWith('### ')) {
      out.push(<h3 key={key++}>{inline(line.slice(4))}</h3>);
      i += 1;
    } else if (line.startsWith('## ')) {
      out.push(<h2 key={key++}>{inline(line.slice(3))}</h2>);
      i += 1;
    } else if (line.startsWith('# ')) {
      out.push(<h1 key={key++}>{inline(line.slice(2))}</h1>);
      i += 1;
    } else if (/^---+$/.test(trimmed)) {
      out.push(<hr key={key++} />);
      i += 1;
    } else if (isOrdered(line)) {
      const items: string[] = [];
      while (i < lines.length && isOrdered(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i += 1;
      }
      out.push(
        <ol key={key++}>
          {items.map((item, n) => <li key={n}>{inline(item)}</li>)}
        </ol>,
      );
    } else if (isBullet(line)) {
      const items: string[] = [];
      while (i < lines.length && isBullet(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s/, ''));
        i += 1;
      }
      const isCheck = items.every((item) => item.startsWith('[ ] '));
      out.push(
        <ul key={key++} className={isCheck ? 'check' : undefined}>
          {items.map((item, n) => (
            <li key={n}>{isCheck ? <>☐ {inline(item.slice(4))}</> : inline(item)}</li>
          ))}
        </ul>,
      );
    } else {
      out.push(<p key={key++}>{inline(line)}</p>);
      i += 1;
    }
  }

  return <Doc>{out}</Doc>;
}
