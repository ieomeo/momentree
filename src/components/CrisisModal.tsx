import styled from '@emotion/styled';
import { FaPhoneAlt, FaLightbulb } from 'react-icons/fa';
import { Button, Modal, Muted } from './ui';
import { color } from '../styles/theme';

const Boxes = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
  margin: 1rem 0;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

const Box = styled.div<{ $bg: string }>`
  background: ${({ $bg }) => $bg};
  border-radius: 12px;
  padding: 1rem;
  font-size: 0.9rem;
  h4 { margin-bottom: 0.5rem; display: flex; gap: 0.4rem; align-items: center; }
  li { margin-bottom: 0.3rem; }
`;

const Actions = styled.div`
  display: flex;
  gap: 0.6rem;
  justify-content: center;
  margin-top: 1rem;
`;

interface Props {
  onEdit: () => void;
  onPublish: () => void;
}

// 위기 키워드가 감지됐을 때 작성자에게 보여주는 도움 안내 (화면 ⑤)
export default function CrisisModal({ onEdit, onPublish }: Props) {
  return (
    <Modal>
      <h2 style={{ textAlign: 'center' }}>혼자가 아니에요</h2>
      <Muted style={{ textAlign: 'center' }}>지금 마음이 많이 힘드신 것 같아요. 글은 그대로 올릴 수 있어요.</Muted>
      <Boxes>
        <Box $bg={color.greenSoft}>
          <h4><FaPhoneAlt /> 24시간 마음건강 상담전화</h4>
          <ul>
            <li>자살예방 상담전화: 109 (24시간 운영)</li>
            <li>정신건강 위기상담: 1577-0199</li>
            <li>청소년 상담전화: 1388 (문자/카톡 상담 가능)</li>
          </ul>
        </Box>
        <Box $bg={color.yellow}>
          <h4><FaLightbulb /> 전화 통화가 부담스러우시다면?</h4>
          <ul>
            <li>카카오톡 채널: '다 들어주는 개' 또는 '109' 검색 후 1:1 상담</li>
            <li>문자 상담: #1388 (청소년/청년 무료 문자 상담)</li>
          </ul>
        </Box>
      </Boxes>
      <Muted style={{ textAlign: 'center' }}>안전을 위해 운영팀이 이 글을 살펴볼 수 있어요</Muted>
      <Actions>
        <Button $variant="sand" onClick={onEdit}>수정하기</Button>
        <Button onClick={onPublish}>그대로 등록하기</Button>
      </Actions>
    </Modal>
  );
}
