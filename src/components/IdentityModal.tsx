import styled from '@emotion/styled';
import { Button, Modal, Muted } from './ui';
import { color } from '../styles/theme';
import type { IdentityView } from '../types';

const Warn = styled.p`
  background: #fbe9e4;
  border: 1.5px solid ${color.danger};
  border-radius: 10px;
  padding: 0.7rem 0.9rem;
  margin: 0.8rem 0;
  font-size: 0.9rem;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid ${color.bg};
  span:first-of-type { color: ${color.brownSoft}; }
  strong { text-align: right; word-break: break-all; }
`;

// 운영자가 확인하는 회원 개인정보 창. 열람할 때마다 기록이 남아요.
export default function IdentityModal({ view, onClose }: { view: IdentityView; onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <h3>개인정보 확인 · {view.nickname}</h3>
      <Warn>
        위기 대응과 이용자 보호 목적으로만 사용하세요. 열람 기록이 남고, 다른 곳에 옮겨 적거나 공유하면 안 돼요.
      </Warn>
      <Row><span>닉네임</span><strong>{view.nickname}</strong></Row>
      <Row><span>이메일</span><strong>{view.email}</strong></Row>
      {view.identity ? (
        <>
          <Row><span>이름</span><strong>{view.identity.name}</strong></Row>
          <Row><span>생년월일</span><strong>{view.identity.birthDate}</strong></Row>
          <Row><span>연락처</span><strong>{view.identity.phone}</strong></Row>
        </>
      ) : (
        <Muted style={{ marginTop: '0.8rem' }}>
          수집된 개인정보가 없어요. (이 기능이 생기기 전에 가입했거나 운영자가 만든 계정이에요)
        </Muted>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.2rem' }}>
        <Button onClick={onClose}>닫기</Button>
      </div>
    </Modal>
  );
}
