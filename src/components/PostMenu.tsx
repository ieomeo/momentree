import { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { FaEllipsisH } from 'react-icons/fa';
import { color } from '../styles/theme';

export interface MenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

const Box = styled.div`
  position: relative;
`;

const Trigger = styled.button`
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: ${color.brownSoft};
  cursor: pointer;
  &:hover { background: ${color.bg}; color: ${color.brown}; }
`;

const Dropdown = styled.div`
  position: absolute;
  top: 38px;
  right: 0;
  z-index: 20;
  min-width: 140px;
  padding: 0.3rem;
  background: white;
  border: 1.5px solid ${color.border};
  border-radius: 10px;
  box-shadow: 0 6px 18px rgba(60, 45, 40, 0.15);
`;

const Item = styled.button<{ $danger?: boolean }>`
  display: block;
  width: 100%;
  padding: 0.5rem 0.8rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: ${({ $danger }) => ($danger ? color.danger : color.brown)};
  font-weight: ${({ $danger }) => ($danger ? 700 : 500)};
  &:hover { background: ${color.bg}; }
`;

// 오른쪽 위 점세개(⋯) 메뉴. 바깥을 누르거나 Esc를 누르면 닫힙니다.
export default function PostMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <Box ref={ref}>
      <Trigger
        type="button"
        aria-label="더보기"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <FaEllipsisH />
      </Trigger>
      {open && (
        <Dropdown role="menu">
          {items.map((item) => (
            <Item
              key={item.label}
              role="menuitem"
              type="button"
              $danger={item.danger}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
            >
              {item.label}
            </Item>
          ))}
        </Dropdown>
      )}
    </Box>
  );
}
