import { useState } from 'react';
import styled from '@emotion/styled';
import { Button, Field, Input, Modal } from './ui';
import { WITHDRAW_BLOCK_DAYS } from '../services/api';
import { color } from '../styles/theme';

const Warn = styled.div`
  background: #fbe9e4;
  border: 1.5px solid ${color.danger};
  border-radius: 10px;
  padding: 0.9rem 1rem;
  margin: 0.8rem 0 1rem;
  li { margin: 0.25rem 0 0.25rem 1.1rem; list-style: disc; }
`;

const Check = styled.label`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.9rem;
  cursor: pointer;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
`;

interface Props {
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
}

// 탈퇴 확인 모달: 경고 → 동의 체크 → 비밀번호 확인
export default function WithdrawModal({ onClose, onConfirm }: Props) {
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await onConfirm(password);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <h3>정말 탈퇴할까요?</h3>
      <Warn>
        <strong>탈퇴 전에 꼭 확인해주세요</strong>
        <ul>
          <li>계정과 보유 나뭇잎, 구독·차단 정보가 삭제되고 되돌릴 수 없어요.</li>
          <li>작성한 글과 댓글은 남고, 작성자는 “탈퇴한 사용자”로 표시돼요.</li>
          <li><strong>같은 이메일로는 탈퇴 후 {WITHDRAW_BLOCK_DAYS}일 동안 다시 가입할 수 없어요.</strong></li>
        </ul>
      </Warn>
      <Check>
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        위 내용을 모두 확인했어요
      </Check>
      <Field>
        <Input
          type="password"
          placeholder="비밀번호를 입력해 본인 확인"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <Actions>
        <Button $variant="sand" onClick={onClose}>취소</Button>
        <Button
          disabled={!agree || password === '' || busy}
          style={{ background: color.danger, color: 'white' }}
          onClick={submit}
        >
          탈퇴하기
        </Button>
      </Actions>
    </Modal>
  );
}
