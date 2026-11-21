import styled from '@emotion/styled';
import type { ReactNode } from 'react';
import { color } from '../styles/theme';

export const Button = styled.button<{ $variant?: 'primary' | 'pink' | 'sand' | 'ghost' }>`
  padding: 0.6rem 1.1rem;
  border-radius: 10px;
  border: 1px solid transparent;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  background: ${({ $variant = 'primary' }) =>
    ({ primary: color.green, pink: color.pink, sand: color.sand, ghost: 'transparent' })[$variant]};
  &:hover { filter: brightness(0.96); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const fieldStyle = `
  width: 100%;
  padding: 0.7rem 0.9rem;
  border: 1.5px solid ${color.border};
  border-radius: 10px;
  background: white;
  font-size: 1rem;
`;

export const Input = styled.input`${fieldStyle}`;
export const Select = styled.select`${fieldStyle}`;
export const Textarea = styled.textarea`${fieldStyle} min-height: 240px; resize: vertical;`;

export const Field = styled.div`
  margin-bottom: 0.9rem;
`;

export const ErrorText = styled.p`
  color: ${color.danger};
  font-size: 0.85rem;
  margin-top: 0.25rem;
`;

export const Card = styled.section`
  background: white;
  border: 1.5px solid ${color.border};
  border-radius: 12px;
  padding: 1.1rem 1.3rem;
`;

export const Tag = styled.span<{ $bg: string }>`
  display: inline-block;
  padding: 0.1rem 0.75rem;
  border-radius: 999px;
  background: ${({ $bg }) => $bg};
  font-size: 0.8rem;
  font-weight: 700;
`;

export const NoticeBadge = styled.span`
  display: inline-block;
  padding: 0.1rem 0.75rem;
  border-radius: 999px;
  background: ${color.notice};
  color: white;
  font-size: 0.8rem;
  font-weight: 800;
`;

export const Muted = styled.p`
  color: ${color.brownSoft};
  font-size: 0.9rem;
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(60, 45, 40, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 100;
`;

const Dialog = styled.div<{ $wide?: boolean }>`
  width: 100%;
  max-width: ${({ $wide }) => ($wide ? '780px' : '560px')};
  max-height: 90vh;
  overflow-y: auto;
  background: white;
  border: 2px solid ${color.border};
  border-radius: 16px;
  padding: 1.6rem;
`;

export function Modal({ children, onClose, wide }: { children: ReactNode; onClose?: () => void; wide?: boolean }) {
  return (
    <Overlay onClick={onClose}>
      <Dialog role="dialog" aria-modal="true" $wide={wide} onClick={(e) => e.stopPropagation()}>
        {children}
      </Dialog>
    </Overlay>
  );
}
