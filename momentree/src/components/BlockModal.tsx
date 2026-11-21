import styled from '@emotion/styled';
import { Button, Modal } from './ui';

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 1.2rem;
`;

// 차단 확인 모달 (화면 ⑦)
export default function BlockModal({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <h3>이 사용자를 차단할까요?</h3>
      <p style={{ marginTop: '0.6rem' }}>
        차단하면 서로의 글·댓글이 보이지 않아요. 나의 정원에서 언제든 해제할 수 있어요.
      </p>
      <Actions>
        <Button $variant="sand" onClick={onClose}>취소</Button>
        <Button onClick={onConfirm}>차단하기</Button>
      </Actions>
    </Modal>
  );
}
