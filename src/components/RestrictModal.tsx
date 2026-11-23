import { useState } from 'react';
import styled from '@emotion/styled';
import { Button, Modal, Muted } from './ui';

const OPTIONS: { days: number; label: string }[] = [
  { days: 1, label: '1일' },
  { days: 3, label: '3일' },
  { days: 7, label: '7일' },
  { days: 30, label: '1달 (30일)' },
  { days: 90, label: '3달 (90일)' },
  { days: 0, label: '영구' },
];

const Radio = styled.label`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0;
  cursor: pointer;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 1rem;
`;

// 이용 제한 기간을 고르는 창. 제한 중에는 글쓰기·댓글·공감·구독·신고를 할 수 없어요.
export default function RestrictModal({ onConfirm, onClose, initialDays, initialStop }: { initialDays?: number; initialStop?: boolean; onConfirm: (days: number, stop: boolean) => void; onClose: () => void }) {
  const [days, setDays] = useState(initialDays ?? 7);
  const [stop, setStop] = useState(initialStop ?? false);
  return (
    <Modal onClose={onClose}>
      <h3>이용 제한 기간</h3>
      <Muted style={{ margin: '0.3rem 0 0.8rem' }}>
        제한 중에는 글쓰기·댓글·공감·구독·신고를 할 수 없고, 읽기와 내 글 관리는 할 수 있어요. 작성자에게 알림이 가요.
      </Muted>
      {OPTIONS.map((o) => (
        <Radio key={o.days}>
          <input type="radio" name="days" checked={days === o.days} onChange={() => setDays(o.days)} />
          {o.label}
        </Radio>
      ))}
      <Radio><input type="checkbox" checked={stop} onChange={(e) => setStop(e.target.checked)} /> 문제 글·댓글도 경고 후 게시 중단</Radio>
      <Actions>
        <Button $variant="sand" onClick={onClose}>취소</Button>
        <Button onClick={() => onConfirm(days, stop)}>이용 제한하기</Button>
      </Actions>
    </Modal>
  );
}
