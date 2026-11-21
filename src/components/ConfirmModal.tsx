import styled from '@emotion/styled';
import { Button, Modal } from './ui';
import { color } from '../styles/theme';

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 1.2rem;
`;

interface Props {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

// 되돌릴 수 없는 작업(삭제 등)을 한 번 더 확인하는 창
export default function ConfirmModal({ title, message, confirmLabel, onConfirm, onClose }: Props) {
  return (
    <Modal onClose={onClose}>
      <h3>{title}</h3>
      <p style={{ marginTop: '0.6rem' }}>{message}</p>
      <Actions>
        <Button $variant="sand" onClick={onClose}>취소</Button>
        <Button style={{ background: color.danger, color: 'white' }} onClick={onConfirm}>{confirmLabel}</Button>
      </Actions>
    </Modal>
  );
}
