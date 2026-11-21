import styled from '@emotion/styled';
import MarkdownLite from './MarkdownLite';
import { Button, Modal } from './ui';

const Top = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.4rem;
`;

const Bottom = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1.4rem;
`;

// 약관·동의서·커뮤니티 약속 등 전문을 보여주는 큰 모달
export default function LegalModal({ content, onClose }: { content: string; onClose: () => void }) {
  return (
    <Modal onClose={onClose} wide>
      <Top>
        <Button $variant="sand" onClick={onClose}>닫기</Button>
      </Top>
      <MarkdownLite text={content} />
      <Bottom>
        <Button onClick={onClose}>확인했어요</Button>
      </Bottom>
    </Modal>
  );
}
